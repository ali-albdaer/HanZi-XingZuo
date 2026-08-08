import { APP_CONFIG, type MasteryLevel } from '../config/app.config';
import { db, type UserProgressEntity } from '../db/schema';

export function isMasteryDecayed(
  mastery: MasteryLevel,
  lastReviewedAt: number | null,
  now: number = Date.now(),
  multiplier: number = 3.0 // Default 3x spacing for reduced repetition
): boolean {
  if (mastery === 'grey' || !lastReviewedAt) {
    return false;
  }

  const elapsedHours = (now - lastReviewedAt) / (1000 * 60 * 60);

  if (mastery === 'gold') {
    return elapsedHours > APP_CONFIG.mastery.decayHours.goldToSilver * multiplier;
  }
  if (mastery === 'silver') {
    return elapsedHours > APP_CONFIG.mastery.decayHours.silverToBronze * multiplier;
  }
  if (mastery === 'bronze') {
    return elapsedHours > APP_CONFIG.mastery.decayHours.bronzeToGrey * multiplier;
  }

  return false;
}

export function calculateEffectiveMastery(
  progress: UserProgressEntity,
  now: number = Date.now()
): MasteryLevel {
  const { mastery, lastReviewedAt } = progress;

  if (mastery === 'grey' || !lastReviewedAt) {
    return 'grey';
  }

  const elapsedHours = (now - lastReviewedAt) / (1000 * 60 * 60);

  if (mastery === 'gold') {
    if (elapsedHours > APP_CONFIG.mastery.decayHours.goldToSilver) {
      return 'silver';
    }
    return 'gold';
  }

  if (mastery === 'silver') {
    if (elapsedHours > APP_CONFIG.mastery.decayHours.silverToBronze) {
      return 'bronze';
    }
    return 'silver';
  }

  if (mastery === 'bronze') {
    if (elapsedHours > APP_CONFIG.mastery.decayHours.bronzeToGrey) {
      return 'grey';
    }
    return 'bronze';
  }

  return mastery;
}

export function recordExerciseResult(
  currentProgress: UserProgressEntity,
  isCorrect: boolean,
  isKeyboardMode: boolean = false,
  now: number = Date.now()
): UserProgressEntity {
  const keyboardCleared = currentProgress.keyboardCleared || (isCorrect && isKeyboardMode);

  if (!isCorrect) {
    // Wrong answers NEVER promote grey (unseen) characters to learned/bronze!
    const newMastery: MasteryLevel = currentProgress.mastery === 'grey' ? 'grey' : 'bronze';

    return {
      ...currentProgress,
      mastery: newMastery,
      correctStreak: 0,
      totalReviews: currentProgress.totalReviews + 1,
      lastReviewedAt: now,
      keyboardCleared,
    };
  }

  const newStreak = currentProgress.correctStreak + 1;
  let newMastery: MasteryLevel = 'bronze';

  if (newStreak >= 4 && keyboardCleared) {
    newMastery = 'gold';
  } else if (newStreak >= 2) {
    newMastery = 'silver';
  } else {
    newMastery = 'bronze';
  }

  return {
    ...currentProgress,
    mastery: newMastery,
    correctStreak: newStreak,
    totalReviews: currentProgress.totalReviews + 1,
    lastReviewedAt: now,
    keyboardCleared,
  };
}

export async function saveExerciseResult(
  characterId: string,
  deckId: string,
  isCorrect: boolean,
  isKeyboardMode: boolean = false
): Promise<UserProgressEntity> {
  const existing = (await db.userProgress.get(characterId)) || {
    characterId,
    deckId,
    mastery: 'grey',
    lastReviewedAt: null,
    correctStreak: 0,
    totalReviews: 0,
    keyboardCleared: false,
  };

  const updated = recordExerciseResult(existing, isCorrect, isKeyboardMode);
  await db.userProgress.put(updated);
  return updated;
}
