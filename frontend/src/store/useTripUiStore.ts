import { create } from 'zustand';

export type TripTab = 'itinerary' | 'budget' | 'checklist' | 'collab';

interface TripUiState {
  activeTab: TripTab;
  isSidebarOpen: boolean;
  selectedTripId: string | null;
  selectedDayNumber: number;
  setActiveTab: (tab: TripTab) => void;
  toggleSidebar: () => void;
  setSelectedTripId: (id: string | null) => void;
  setSelectedDayNumber: (dayNumber: number) => void;
}

export const useTripUiStore = create<TripUiState>((set) => ({
  activeTab: 'itinerary',
  isSidebarOpen: true,
  selectedTripId: null,
  selectedDayNumber: 1,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSelectedTripId: (id) =>
    set((state) => ({
      selectedTripId: id,
      selectedDayNumber: state.selectedTripId !== id ? 1 : state.selectedDayNumber,
    })),
  setSelectedDayNumber: (dayNumber) => set({ selectedDayNumber: Math.max(1, dayNumber) }),
}));
