export const APP_CONFIG = {
  mastery: {
    colors: {
      grey: '#4A4A5B',    // Locked/Unpracticed
      bronze: '#CD7F32',  // Familiar
      silver: '#A0B0C0',  // Comfortable
      gold: '#FFD700',    // Mastered
    },
    labels: {
      grey: 'Locked',
      bronze: 'Familiar',
      silver: 'Comfortable',
      gold: 'Mastered',
    },
    decayHours: {
      goldToSilver: 720,   // 30 days
      silverToBronze: 168, // 7 days
      bronzeToGrey: 48,    // 2 days
    },
  },
  session: {
    defaultNewCharacters: 5,
    defaultReviews: 15,
    maxSessionSize: 20,
  },
  animation: {
    nodeCenterMs: 400,
    pageTransitionMs: 250,
    feedbackFlashMs: 200,
    cardExpandMs: 200,
  },
  deck: {
    defaultSort: 'frequency' as const, // 'frequency' | 'alphabetical' | 'mastery' | 'radical'
    sentencesPerCharacter: 3,
    maxSentenceLength: 12,
  },
} as const;

export type SortOption = 'frequency' | 'alphabetical' | 'mastery' | 'radical';
export type MasteryLevel = 'grey' | 'bronze' | 'silver' | 'gold';

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  grey: APP_CONFIG.mastery.colors.grey,
  bronze: APP_CONFIG.mastery.colors.bronze,
  silver: APP_CONFIG.mastery.colors.silver,
  gold: APP_CONFIG.mastery.colors.gold,
};
