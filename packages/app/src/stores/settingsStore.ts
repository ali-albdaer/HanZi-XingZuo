import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'dark' | 'light';
export type RepetitionFrequency = 'low' | 'balanced' | 'high';

interface SettingsState {
  inputMode: 'selection' | 'keyboard';
  theme: AppTheme;
  repetitionFrequency: RepetitionFrequency;
  newCharactersPerSession: number;
  reviewsPerSession: number;

  setInputMode: (mode: 'selection' | 'keyboard') => void;
  setTheme: (theme: AppTheme) => void;
  setRepetitionFrequency: (freq: RepetitionFrequency) => void;
  setNewCharactersPerSession: (val: number) => void;
  setReviewsPerSession: (val: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      inputMode: 'selection',
      theme: 'dark',
      repetitionFrequency: 'low', // Default: Low repetition (reduced repeat frequency as requested!)
      newCharactersPerSession: 8,
      reviewsPerSession: 4,

      setInputMode: (mode) => set({ inputMode: mode }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      setRepetitionFrequency: (freq) => set({ repetitionFrequency: freq }),
      setNewCharactersPerSession: (val) => set({ newCharactersPerSession: val }),
      setReviewsPerSession: (val) => set({ reviewsPerSession: val }),
    }),
    {
      name: 'hanzi-settings-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
