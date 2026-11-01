import { create } from 'zustand';

export type TripTab = 'itinerary' | 'budget' | 'checklist' | 'collab';

interface TripUiState {
  activeTab: TripTab;
  isSidebarOpen: boolean;
  selectedTripId: string | null;
  setActiveTab: (tab: TripTab) => void;
  toggleSidebar: () => void;
  setSelectedTripId: (id: string | null) => void;
}

export const useTripUiStore = create<TripUiState>((set) => ({
  activeTab: 'itinerary',
  isSidebarOpen: true,
  selectedTripId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSelectedTripId: (id) => set({ selectedTripId: id }),
}));

