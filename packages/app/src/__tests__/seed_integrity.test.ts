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
      expect(charSentences.get(c.id)).toBe(3);
    }
  });

  it('ensures all sentences have pre-segmented chunks', () => {
    for (const s of seedData.sentences) {
      expect(s.chunks.length).toBeGreaterThan(0);
      expect(s.chunks.join('')).toBe(s.chinese);
    }
  });
});
