import { create } from 'zustand';

interface MapHoverState {
  hoveredPlaceId: string | number | null;
  setHoveredPlaceId: (placeId: string | number | null) => void;
}

// Store riêng cho hover để không đụng useMapStore
export const useMapHoverStore = create<MapHoverState>((set) => ({
  hoveredPlaceId: null,
  setHoveredPlaceId: (placeId) => set({ hoveredPlaceId: placeId }),
}));