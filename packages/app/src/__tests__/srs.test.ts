import { describe, it, expect } from 'vitest';
import { calculateEffectiveMastery, recordExerciseResult } from '../core/srs';
import type { UserProgressEntity } from '../db/schema';

describe('SRS Decay Algorithm', () => {
  it('returns grey for unpracticed characters', () => {
    const progress: UserProgressEntity = {
      characterId: '你',
      deckId: 'top-1000',
      mastery: 'grey',
      lastReviewedAt: null,
      correctStreak: 0,
      totalReviews: 0,
      keyboardCleared: false,
    };
    expect(calculateEffectiveMastery(progress)).toBe('grey');
  });

  it('decays gold to silver after 720 hours', () => {
    const now = Date.now();
    const hours721Ago = now - 721 * 60 * 60 * 1000;

    const progress: UserProgressEntity = {
      characterId: '我',
      deckId: 'top-1000',
      mastery: 'gold',
      lastReviewedAt: hours721Ago,
      correctStreak: 5,
      totalReviews: 10,
      keyboardCleared: true,
    };
    expect(calculateEffectiveMastery(progress, now)).toBe('silver');
  });

  it('promotes streak=4 to Gold if keyboard cleared', () => {
    const progress: UserProgressEntity = {
      characterId: '是',
      deckId: 'top-1000',
      mastery: 'silver',
      lastReviewedAt: Date.now() - 3600000,
      correctStreak: 3,
      totalReviews: 5,
      keyboardCleared: false,
    };

    const result = recordExerciseResult(progress, true, true); // Correct + Keyboard Mode
    expect(result.mastery).toBe('gold');
    expect(result.keyboardCleared).toBe(true);
    expect(result.correctStreak).toBe(4);
  });

  it('caps at Silver if streak=4 but keyboard not cleared', () => {
    const progress: UserProgressEntity = {
      characterId: '是',
      deckId: 'top-1000',
      mastery: 'silver',
      lastReviewedAt: Date.now() - 3600000,
      correctStreak: 3,
      totalReviews: 5,
      keyboardCleared: false,
    };

    const result = recordExerciseResult(progress, true, false); // Correct + Selection Mode
    expect(result.mastery).toBe('silver');
    expect(result.keyboardCleared).toBe(false);
  });

  it('keeps grey mastery for wrong answers on unseen characters', () => {
    const progress: UserProgressEntity = {
      characterId: '好',
      deckId: 'top-1000',
      mastery: 'grey',
      lastReviewedAt: null,
      correctStreak: 0,
      totalReviews: 0,
      keyboardCleared: false,
    };

    const result = recordExerciseResult(progress, false, false); // Incorrect answer
    expect(result.mastery).toBe('grey');
    expect(result.correctStreak).toBe(0);
  });
});
