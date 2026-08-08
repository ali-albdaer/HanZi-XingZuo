import { APP_CONFIG, type MasteryLevel } from '../config/app.config';
import type { UserProgressEntity } from '../db/schema';

export function calculateEffectiveMastery(progress: UserProgressEntity, now: number = Date.now()): MasteryLevel {
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
  isKeyboardMode: boolean,
  now: number = Date.now()
): UserProgressEntity {
  const keyboardCleared = currentProgress.keyboardCleared || (isCorrect && isKeyboardMode);

  if (!isCorrect) {
    return {
      ...currentProgress,
      mastery: 'bronze', // Demote to bronze on error
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
