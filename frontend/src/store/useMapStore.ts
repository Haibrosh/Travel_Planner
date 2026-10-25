import { create } from 'zustand';
import { PlaceDetailData } from '@/components/modals/PlaceDetailModal';

interface MapState {
  selectedPlace: PlaceDetailData | null;
  isModalOpen: boolean;
  setSelectedPlace: (place: PlaceDetailData | null) => void;
  openModal: (place: PlaceDetailData) => void;
  closeModal: () => void;
  toggleVisited: (id: string | number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedPlace: null,
  isModalOpen: false,
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  openModal: (place) => set({ selectedPlace: place, isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleVisited: (id) =>
    set((state) => ({
      selectedPlace:
        state.selectedPlace && state.selectedPlace.id === id
          ? { ...state.selectedPlace, isVisited: !state.selectedPlace.isVisited }
          : state.selectedPlace,
    })),
}));