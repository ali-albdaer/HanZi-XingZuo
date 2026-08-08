import { create } from 'zustand';
import type { SortOption } from '../config/app.config';
import type { CharacterWithProgress } from '../db/queries';

interface DeckState {
  activeDeckId: string;
  viewMode: 'list' | 'orbit' | 'showAll';
  sortOption: SortOption;
  searchQuery: string;
  selectedCharacter: CharacterWithProgress | null;
  masteryFilter: Record<'grey' | 'bronze' | 'silver' | 'gold', boolean>;
  showAllConstellation: boolean;
  
  setActiveDeckId: (id: string) => void;
  setViewMode: (mode: 'list' | 'orbit' | 'showAll') => void;
  setSortOption: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCharacter: (char: CharacterWithProgress | null) => void;
  toggleMasteryFilter: (level: 'grey' | 'bronze' | 'silver' | 'gold') => void;
  setShowAllConstellation: (showAll: boolean) => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  activeDeckId: 'top-1000',
  viewMode: 'list',
  sortOption: 'frequency',
  searchQuery: '',
  selectedCharacter: null,
  masteryFilter: {
    grey: true,
    bronze: true,
    silver: true,
    gold: true,
  },
  showAllConstellation: false,

  setActiveDeckId: (id) => set({ activeDeckId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortOption: (sort) => set({ sortOption: sort }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCharacter: (char) => set({ selectedCharacter: char }),
  toggleMasteryFilter: (level) =>
    set((state) => ({
      masteryFilter: {
        ...state.masteryFilter,
        [level]: !state.masteryFilter[level],
      },
    })),
  setShowAllConstellation: (showAll) => set({ showAllConstellation: showAll }),
}));
