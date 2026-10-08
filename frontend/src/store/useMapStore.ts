import { create } from 'zustand';

interface MapState {
  center: [number, number];
  zoom: number;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [0, 0], // Default center
  zoom: 10,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
}));
