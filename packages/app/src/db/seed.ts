import { db, type DeckEntity, type CharacterEntity, type SentenceEntity, type UserProgressEntity } from './schema';

export async function ensureDatabaseSeeded(): Promise<void> {
  const existingDecks = await db.decks.count();
  const sampleSentence = await db.sentences.toCollection().first();
  const sampleChar = await db.characters.get('上');
  const isNoisy = sampleChar && sampleChar.definitions.some((d) => d.includes('used in') || d.includes('surname'));
  const hasHsk = sampleChar && sampleChar.hskLevel;

  if (existingDecks > 0 && sampleSentence && sampleSentence.pinyin && sampleChar && !isNoisy && hasHsk) {
    return;
  }

  console.log('[SEED] Initializing/Updating database from seed-data.json...');
  try {
    await db.transaction('rw', [db.decks, db.characters, db.sentences, db.userProgress], async () => {
      await db.decks.clear();
      await db.characters.clear();
      await db.sentences.clear();
    });
    const response = await fetch('/seed-data.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch seed data: ${response.statusText}`);
    }

    const data = await response.json();
    const builtInDeck: DeckEntity = data.deck;
    const characters: CharacterEntity[] = data.characters;
    const sentences: SentenceEntity[] = data.sentences;

    const vaultDeck: DeckEntity = {
      id: 'my-vault',
      name: 'My Vault',
      description: 'Custom characters and sentences mined from your reading',
      isBuiltIn: false,
      createdAt: Date.now(),
    };

    const initialProgress: UserProgressEntity[] = characters.map((c) => ({
      characterId: c.id,
      deckId: c.deckId,
      mastery: 'grey',
      lastReviewedAt: null,
      correctStreak: 0,
      totalReviews: 0,
      keyboardCleared: false,
    }));

    await db.transaction('rw', [db.decks, db.characters, db.sentences, db.userProgress], async () => {
      await db.decks.bulkAdd([builtInDeck, vaultDeck]);
      await db.characters.bulkAdd(characters);
      await db.sentences.bulkAdd(sentences);
      await db.userProgress.bulkAdd(initialProgress);
    });

    console.log('[SEED] Database successfully populated!');
  } catch (error) {
    console.error('[SEED] Failed to seed database:', error);
  }
}
