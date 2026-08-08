import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'dark' | 'light';

interface SettingsState {
  inputMode: 'selection' | 'keyboard';
  theme: AppTheme;
  newCharactersPerSession: number;
  reviewsPerSession: number;

  setInputMode: (mode: 'selection' | 'keyboard') => void;
  setTheme: (theme: AppTheme) => void;
  setNewCharactersPerSession: (val: number) => void;
  setReviewsPerSession: (val: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      inputMode: 'selection',
      theme: 'dark',
      newCharactersPerSession: 5,
      reviewsPerSession: 15,

      setInputMode: (mode) => set({ inputMode: mode }),
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
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
