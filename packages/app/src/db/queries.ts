import { db, type DeckEntity, type CharacterEntity, type SentenceEntity, type UserProgressEntity } from './schema';
import { APP_CONFIG, type SortOption, type MasteryLevel } from '../config/app.config';
import { calculateEffectiveMastery } from '../core/srs';

export interface CharacterWithProgress extends CharacterEntity {
  progress: UserProgressEntity;
  sentences: SentenceEntity[];
}

export async function getAllDecks(): Promise<DeckEntity[]> {
  return await db.decks.toArray();
}

export async function getDeckCharacters(
  deckId: string,
  sort: SortOption = APP_CONFIG.deck.defaultSort
): Promise<CharacterWithProgress[]> {
  const characters = await db.characters.where('deckId').equals(deckId).toArray();
  const progressList = await db.userProgress.where('deckId').equals(deckId).toArray();
  const sentencesList = await db.sentences.where('deckId').equals(deckId).toArray();

  const progressMap = new Map<string, UserProgressEntity>();
  for (const p of progressList) {
    // Calculate effective SRS decay for up-to-date visual progress
    const effectiveMastery = calculateEffectiveMastery(p);
    progressMap.set(p.characterId, {
      ...p,
      mastery: effectiveMastery,
    });
  }

  const sentenceMap = new Map<string, SentenceEntity[]>();
  for (const s of sentencesList) {
    const arr = sentenceMap.get(s.characterId) || [];
    arr.push(s);
    sentenceMap.set(s.characterId, arr);
  }

  const result: CharacterWithProgress[] = characters.map((c) => ({
    ...c,
    progress: progressMap.get(c.id) || {
      characterId: c.id,
      deckId: c.deckId,
      mastery: 'grey',
      lastReviewedAt: null,
      correctStreak: 0,
      totalReviews: 0,
      keyboardCleared: false,
    },
    sentences: sentenceMap.get(c.id) || [],
  }));

  // Apply sorting
  return sortCharacters(result, sort);
}

const MASTERY_RANK: Record<MasteryLevel, number> = {
  grey: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

export function sortCharacters(list: CharacterWithProgress[], sort: SortOption): CharacterWithProgress[] {
  if (sort === 'random') {
    return list.slice().sort(() => Math.random() - 0.5);
  }
  return list.slice().sort((a, b) => {
    if (sort === 'frequency') {
      return a.frequency - b.frequency;
    }
    if (sort === 'alphabetical') {
      const pyA = a.pinyin[0] || '';
      const pyB = b.pinyin[0] || '';
      return pyA.localeCompare(pyB);
    }
    if (sort === 'mastery') {
      const rankA = MASTERY_RANK[a.progress.mastery];
      const rankB = MASTERY_RANK[b.progress.mastery];
      if (rankA !== rankB) return rankB - rankA; // Highest mastery first
      return a.frequency - b.frequency;
    }
    if (sort === 'radical') {
      const radA = a.radical || 'ー';
      const radB = b.radical || 'ー';
      if (radA !== radB) return radA.localeCompare(radB);
      return a.frequency - b.frequency;
    }
    return 0;
  });
}

export async function addCharacterToVault(
  char: string,
  pinyin: string,
  definitions: string[],
  sentenceContext?: { chinese: string; pinyin?: string; english: string; chunks: string[] }
): Promise<void> {
  const existing = await db.characters.get(char);
  if (!existing) {
    const newChar: CharacterEntity = {
      id: char,
      deckId: 'my-vault',
      pinyin: [pinyin],
      definitions,
      frequency: 9999,
      hskLevel: '1',
      components: [],
      radical: '',
    };
    await db.characters.add(newChar);

    await db.userProgress.add({
      characterId: char,
      deckId: 'my-vault',
      mastery: 'grey',
      lastReviewedAt: null,
      correctStreak: 0,
      totalReviews: 0,
      keyboardCleared: false,
    });
  }

  if (sentenceContext) {
    const existingSentences = await db.sentences.where('characterId').equals(char).toArray();
    if (!existingSentences.some((s) => s.chinese === sentenceContext.chinese)) {
      await db.sentences.add({
        id: `vault-s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        characterId: char,
        deckId: 'my-vault',
        chinese: sentenceContext.chinese,
        pinyin: sentenceContext.pinyin || '',
        english: sentenceContext.english,
        chunks: sentenceContext.chunks,
      });
    }
  }
}

export async function createCustomDeckFromText(
  title: string,
  description: string,
  rawText: string
): Promise<string> {
  const { normalizeTextToDeck } = await import('../core/normalization');

  const deckId = `deck-custom-${Date.now()}`;
  const normalized = await normalizeTextToDeck(deckId, title, description, rawText);

  await db.transaction('rw', [db.decks, db.characters, db.sentences, db.userProgress], async () => {
    await db.decks.add(normalized.deck);
    await db.characters.bulkPut(normalized.characters);
    await db.sentences.bulkPut(normalized.sentences);

    // Initialize progress for custom deck characters
    const progressList: UserProgressEntity[] = normalized.characters.map((c) => ({
      characterId: c.id,
      deckId,
      mastery: 'grey',
      lastReviewedAt: null,
      correctStreak: 0,
      totalReviews: 0,
      keyboardCleared: false,
    }));

    await db.userProgress.bulkPut(progressList);
  });

  return deckId;
}

export async function deleteCustomDeck(deckId: string): Promise<void> {
  if (deckId === 'top-1000') return;

  await db.transaction('rw', [db.decks, db.characters, db.sentences, db.userProgress], async () => {
    await db.decks.delete(deckId);
    await db.characters.where('deckId').equals(deckId).delete();
    await db.sentences.where('deckId').equals(deckId).delete();
    await db.userProgress.where('deckId').equals(deckId).delete();
  });
}
