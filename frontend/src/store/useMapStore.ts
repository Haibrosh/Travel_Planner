import { create } from 'zustand';

const DEFAULT_CENTER: [number, number] = [10.346, 107.084]; // Vũng Tàu

interface MapState {
  selectedPlaceId: string | number | null;
  center: [number, number];
  zoom: number;
  setSelectedPlaceId: (placeId: string | number | null) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedPlaceId: null,
  center: DEFAULT_CENTER,
  zoom: 13,
  setSelectedPlaceId: (placeId) => set({ selectedPlaceId: placeId }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
}));

