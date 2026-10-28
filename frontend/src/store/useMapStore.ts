import { create } from 'zustand';
import { PlaceDetailData } from '@/components/modals/PlaceDetailModal';

const DEFAULT_CENTER: [number, number] = [10.346, 107.084]; // Vũng Tàu

interface MapState {
  // State cho TripMap (Hải & Việt)
  selectedPlaceId: string | number | null;
  center: [number, number];
  zoom: number;
  setSelectedPlaceId: (placeId: string | number | null) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;

  // State cho PlaceDetailModal (Viên)
  selectedPlace: PlaceDetailData | null;
  isModalOpen: boolean;
  setSelectedPlace: (place: PlaceDetailData | null) => void;
  openModal: (place: PlaceDetailData) => void;
  closeModal: () => void;
  toggleVisited: (id: string | number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedPlaceId: null,
  center: DEFAULT_CENTER,
  zoom: 13,
  setSelectedPlaceId: (placeId) => set({ selectedPlaceId: placeId }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),

  selectedPlace: null,
  isModalOpen: false,
  setSelectedPlace: (place) =>
    set({ selectedPlace: place, selectedPlaceId: place?.id ?? null }),
  openModal: (place) =>
    set({ selectedPlace: place, selectedPlaceId: place.id, isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleVisited: (id) =>
    set((state) => ({
      selectedPlace:
        state.selectedPlace && state.selectedPlace.id === id
          ? { ...state.selectedPlace, isVisited: !state.selectedPlace.isVisited }
          : state.selectedPlace,
    })),
}));