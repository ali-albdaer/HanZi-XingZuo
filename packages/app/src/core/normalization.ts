import { db, type DeckEntity, type CharacterEntity, type SentenceEntity } from '../db/schema';

export interface NormalizedResult {
  deck: DeckEntity;
  characters: CharacterEntity[];
  sentences: SentenceEntity[];
}

/**
 * Strips non-Chinese characters and normalizes text into sentences and character tokens.
 */
export function extractSentencesAndChars(rawText: string): { sentences: string[]; characters: string[] } {
  // Split into raw sentences by common Chinese & English punctuation / newlines
  const rawSentences = rawText.split(/[。！？!?\n\r]+/).map((s) => s.trim()).filter(Boolean);

  const charSet = new Set<string>();

  rawSentences.forEach((sentence) => {
    // Extract CJK Unified Ideographs range (\u4e00-\u9fa5)
    const matches = sentence.match(/[\u4e00-\u9fa5]/g);
    if (matches) {
      matches.forEach((c) => charSet.add(c));
    }
  });

  return {
    sentences: rawSentences,
    characters: Array.from(charSet),
  };
}

/**
 * Normalizes raw Chinese text into a custom Deck with characters and sentences.
 */
export async function normalizeTextToDeck(
  deckId: string,
  title: string,
  description: string,
  rawText: string
): Promise<NormalizedResult> {
  const { sentences: rawSentences, characters: extractedChars } = extractSentencesAndChars(rawText);

  const deck: DeckEntity = {
    id: deckId,
    name: title,
    description: description || `Custom deck created from text (${extractedChars.length} characters)`,
    isBuiltIn: false,
    createdAt: Date.now(),
  };

  const characters: CharacterEntity[] = [];
  const sentences: SentenceEntity[] = [];
  const charPinyinMap = new Map<string, string>();

  // Look up existing characters in database or build new character entities
  for (let i = 0; i < extractedChars.length; i++) {
    const charStr = extractedChars[i];
    const existing = await db.characters.get(charStr);

    if (existing) {
      const charObj = {
        ...existing,
        deckId,
      };
      characters.push(charObj);
      charPinyinMap.set(charStr, existing.pinyin[0] || '');
    } else {
      const defaultPinyin = 'zì';
      charPinyinMap.set(charStr, defaultPinyin);

      characters.push({
        id: charStr,
        deckId,
        pinyin: [defaultPinyin],
        definitions: ['custom character'],
        frequency: 9000 + i,
        hskLevel: '7-9',
        components: [],
        radical: '',
      });
    }
  }

  // Build sentence entities with simple word chunking
  rawSentences.forEach((sentenceText, idx) => {
    const matchedChars = sentenceText.match(/[\u4e00-\u9fa5]/g) || [];
    if (matchedChars.length === 0) return;

    // Build sentence pinyin from dictionary map
    const sentencePy = sentenceText
      .split('')
      .map((ch) => charPinyinMap.get(ch) || ch)
      .join(' ');

    // Simple chunking into 2-character word blocks for Sentence Magnet game
    const chunks: string[] = [];
    for (let c = 0; c < sentenceText.length; c += 2) {
      chunks.push(sentenceText.slice(c, c + 2));
    }

    matchedChars.forEach((charStr) => {
      sentences.push({
        id: `${deckId}-s-${idx}-${charStr}`,
        characterId: charStr,
        deckId,
        chinese: sentenceText,
        pinyin: sentencePy,
        english: `Custom Text (${sentenceText})`,
        chunks: chunks.length > 1 ? chunks : [sentenceText],
      });
    });
  });

  return {
    deck,
    characters,
    sentences,
  };
}
