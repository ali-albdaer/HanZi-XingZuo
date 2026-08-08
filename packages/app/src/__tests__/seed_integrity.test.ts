import { describe, it, expect } from 'vitest';
import seedData from '../../public/seed-data.json';

describe('Seed Data Integrity', () => {
  it('contains exactly 1000 characters for top-1000 deck', () => {
    expect(seedData.deck.id).toBe('top-1000');
    expect(seedData.characters.length).toBe(1000);
  });

  it('contains exactly 3000 sentences (3 per character)', () => {
    expect(seedData.sentences.length).toBe(3000);
  });

  it('ensures every character has 3 example sentences and pinyin', () => {
    const charSentences = new Map<string, number>();
    for (const s of seedData.sentences) {
      charSentences.set(s.characterId, (charSentences.get(s.characterId) || 0) + 1);
    }

    for (const c of seedData.characters) {
      expect(c.pinyin.length).toBeGreaterThan(0);
      expect(c.definitions.length).toBeGreaterThan(0);
      expect(c.hskLevel).toBeDefined();
      expect(typeof c.hskLevel).toBe('string');
      expect(charSentences.get(c.id)).toBe(3);
    }
  });

  it('ensures all sentences have pre-segmented chunks, pinyin, and top-1000 character composition', () => {
    const top1000Set = new Set(seedData.characters.map((c) => c.id));
    let perfectCount = 0;

    for (const s of seedData.sentences) {
      expect(s.chunks.length).toBeGreaterThan(0);
      expect(s.chunks.join('')).toBe(s.chinese);
      expect(s.pinyin).toBeDefined();
      expect(s.pinyin.length).toBeGreaterThan(0);

      const cChars = [...s.chinese].filter((c) => c >= '\u4e00' && c <= '\u9fff');
      if (cChars.every((c) => top1000Set.has(c))) {
        perfectCount++;
      }
    }

    // Assert that >= 99% of sentences consist 100% of characters in the top-1000 deck
    expect(perfectCount / seedData.sentences.length).toBeGreaterThanOrEqual(0.99);
  });
});
