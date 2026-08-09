import { create } from 'zustand';
import type { ExerciseItem } from '../core/queue';

interface PracticeState {
  queue: ExerciseItem[];
  currentIndex: number;
  userAnswers: Map<number, boolean>;
  preferredClozeMode: 'selection' | 'keyboard';
  sessionActive: boolean;
  isCompleted: boolean;
  isInfinite: boolean;
  returnToPath: string;

  // Actions
  startSession: (queue: ExerciseItem[], isInfinite?: boolean, returnToPath?: string) => void;
  recordAnswer: (index: number, isCorrect: boolean) => void;
  nextExercise: () => void;
  setClozeMode: (mode: 'selection' | 'keyboard') => void;
  endSession: () => void;
  resetSession: () => void;
}

const SAVED_CLOZE_MODE = (localStorage.getItem('hanzi_cloze_mode') as 'selection' | 'keyboard') || 'selection';

export const usePracticeStore = create<PracticeState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  userAnswers: new Map(),
  preferredClozeMode: SAVED_CLOZE_MODE,
  sessionActive: false,
  isCompleted: false,
  isInfinite: true,
  returnToPath: '/decks',

  startSession: (queue, isInfinite = true, returnToPath = '/decks') =>
    set({
      queue,
      currentIndex: 0,
      userAnswers: new Map(),
      sessionActive: true,
      isCompleted: false,
      isInfinite,
      returnToPath,
    }),

  recordAnswer: (index, isCorrect) =>
    set((state) => {
      const nextAnswers = new Map(state.userAnswers);
      nextAnswers.set(index, isCorrect);
      
      let nextQueue = state.queue;
      // If wrong, push to end of queue to repeat later
      if (!isCorrect) {
        nextQueue = [...state.queue, state.queue[index]];
      }

      return { userAnswers: nextAnswers, queue: nextQueue };
    }),

  nextExercise: () => {
    const { currentIndex, queue, isInfinite } = get();
    if (currentIndex + 1 >= queue.length && queue.length > 0) {
      if (isInfinite) {
        // Reshuffle queue items so practice continues infinitely
        const reshuffled = [...queue].sort(() => Math.random() - 0.5);
        set({ queue: [...queue, ...reshuffled], currentIndex: currentIndex + 1 });
      } else {
        // Mark session as completed
        set({ isCompleted: true });
      }
    } else {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  setClozeMode: (mode) => {
    localStorage.setItem('hanzi_cloze_mode', mode);
    set({ preferredClozeMode: mode });
  },

  endSession: () => set({ sessionActive: false, isCompleted: true }),

  resetSession: () =>
    set({
      queue: [],
      currentIndex: 0,
      userAnswers: new Map(),
      sessionActive: false,
      isCompleted: false,
    }),
}));
