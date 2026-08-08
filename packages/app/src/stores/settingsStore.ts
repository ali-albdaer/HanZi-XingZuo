import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  inputMode: 'selection' | 'keyboard';
  newCharactersPerSession: number;
  reviewsPerSession: number;
  
  setInputMode: (mode: 'selection' | 'keyboard') => void;
  setNewCharactersPerSession: (val: number) => void;
  setReviewsPerSession: (val: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      inputMode: 'selection',
      newCharactersPerSession: 5,
      reviewsPerSession: 15,

      setInputMode: (mode) => set({ inputMode: mode }),
      setNewCharactersPerSession: (val) => set({ newCharactersPerSession: val }),
      setReviewsPerSession: (val) => set({ reviewsPerSession: val }),
    }),
    {
      name: 'hanzi-settings-storage',
    }
  )
);
