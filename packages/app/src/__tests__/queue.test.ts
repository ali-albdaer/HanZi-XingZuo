import { describe, it, expect } from 'vitest';
import { generateClozeDistractors } from '../core/distractors';
import type { CharacterEntity } from '../db/schema';

describe('Practice Queue & Distractor Engine', () => {
  const sampleChars: CharacterEntity[] = [
    { id: '我', deckId: 'top-1000', pinyin: ['wǒ'], definitions: ['I'], frequency: 1, hskLevel: '1', components: [], radical: '戈' },
    { id: '的', deckId: 'top-1000', pinyin: ['de'], definitions: ['of'], frequency: 2, hskLevel: '1', components: [], radical: '白' },
    { id: '你', deckId: 'top-1000', pinyin: ['nǐ'], definitions: ['you'], frequency: 3, hskLevel: '1', components: [], radical: '亻' },
    { id: '是', deckId: 'top-1000', pinyin: ['shì'], definitions: ['to be'], frequency: 4, hskLevel: '1', components: [], radical: '日' },
    { id: '了', deckId: 'top-1000', pinyin: ['le'], definitions: ['completed'], frequency: 5, hskLevel: '1', components: [], radical: '乙' },
  ];

  it('generates exactly 3 unique distractors excluding the target character', () => {
    const target = sampleChars[0]; // '我'
    const distractors = generateClozeDistractors(target, sampleChars, 3);

    expect(distractors.length).toBe(3);
    expect(distractors.some((d) => d.id === target.id)).toBe(false);

    const distractorIds = distractors.map((d) => d.id);
    const uniqueIds = new Set(distractorIds);
    expect(uniqueIds.size).toBe(3);
  });
});
