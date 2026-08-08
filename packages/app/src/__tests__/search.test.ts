import { describe, it, expect } from 'vitest';
import { searchAndRankCharacters, stripTones } from '../core/search';
import type { CharacterWithProgress } from '../db/queries';

describe('Search & Prioritization Engine', () => {
  it('strips tone diacritics correctly', () => {
    expect(stripTones('wǒ')).toBe('wo');
    expect(stripTones('shàng')).toBe('shang');
    expect(stripTones('nǐ')).toBe('ni');
  });

  it('ranks exact Pinyin match #1 when searching "wo"', () => {
    const mockList: CharacterWithProgress[] = [
      {
        id: '个',
        deckId: 'top-1000',
        pinyin: ['gè'],
        definitions: ['measure word', 'used in 自个儿'],
        frequency: 14,
        hskLevel: '1',
        components: [],
        radical: '丨',
        progress: { characterId: '个', deckId: 'top-1000', mastery: 'grey', lastReviewedAt: null, correctStreak: 0, totalReviews: 0, keyboardCleared: false },
        sentences: [],
      },
      {
        id: '我',
        deckId: 'top-1000',
        pinyin: ['wǒ'],
        definitions: ['I', 'me', 'my'],
        frequency: 1,
        hskLevel: '1',
        components: ['扌', '戈'],
        radical: '戈',
        progress: { characterId: '我', deckId: 'top-1000', mastery: 'grey', lastReviewedAt: null, correctStreak: 0, totalReviews: 0, keyboardCleared: false },
        sentences: [],
      },
    ];

    const results = searchAndRankCharacters(mockList, 'wo');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('我');
  });
});
