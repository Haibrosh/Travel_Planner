import { create } from 'zustand';

interface TripUiState {
  isSidebarOpen: boolean;
  selectedTripId: string | null;
  toggleSidebar: () => void;
  setSelectedTripId: (id: string | null) => void;
}

export const useTripUiStore = create<TripUiState>((set) => ({
  isSidebarOpen: true,
  selectedTripId: null,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSelectedTripId: (id) => set({ selectedTripId: id }),
}));
