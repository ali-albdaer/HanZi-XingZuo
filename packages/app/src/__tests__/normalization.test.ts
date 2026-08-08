import { describe, it, expect } from 'vitest';
import { extractSentencesAndChars } from '../core/normalization';

describe('Text Normalization Engine', () => {
  it('extracts unique Chinese characters and filters non-Chinese symbols', () => {
    const rawInput = 'Hello! 我们一起学习中文 123! 天气很好。';
    const result = extractSentencesAndChars(rawInput);

    expect(result.sentences.length).toBeGreaterThan(0);
    expect(result.characters).toContain('我');
    expect(result.characters).toContain('们');
    expect(result.characters).toContain('学');
    expect(result.characters).toContain('天');

    // Symbols & Numbers & English should not be in character array
    expect(result.characters).not.toContain('H');
    expect(result.characters).not.toContain('1');
    expect(result.characters).not.toContain('!');
  });
});
