import { create } from 'zustand';
import type { ExerciseItem } from '../core/queue';

interface PracticeState {
  queue: ExerciseItem[];
  currentIndex: number;
  userAnswers: Map<number, boolean>;
  preferredClozeMode: 'selection' | 'keyboard';
  sessionActive: boolean;
  isCompleted: boolean;

  // Actions
  startSession: (queue: ExerciseItem[]) => void;
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

  startSession: (queue) =>
    set({
      queue,
      currentIndex: 0,
      userAnswers: new Map(),
      sessionActive: true,
      isCompleted: false,
    }),

  recordAnswer: (index, isCorrect) =>
    set((state) => {
      const nextAnswers = new Map(state.userAnswers);
      nextAnswers.set(index, isCorrect);
      return { userAnswers: nextAnswers };
    }),

  nextExercise: () => {
    const { currentIndex, queue } = get();
    if (currentIndex + 1 >= queue.length) {
      set({ isCompleted: true, sessionActive: false });
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
