import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type { ItineraryItem } from '@/types/itinerary';

// Mảng rỗng dùng chung để selector luôn trả về cùng một tham chiếu
export const EMPTY_ITEMS: ItineraryItem[] = [];

// TODO: khi backend có API itinerary, chuyển itemsByDay sang React Query
interface ItineraryState {
  tripId: string | null;
  selectedDayKey: string | null;
  selectedPlaceId: string | null; // địa điểm đang chọn (đồng bộ thẻ <-> marker)
  itemsByDay: Record<string, ItineraryItem[]>;
  initTrip: (tripId: string, firstDayKey: string) => void;
  setSelectedDayKey: (dayKey: string) => void;
  setSelectedPlaceId: (placeId: string | null) => void;
  addItem: (dayKey: string, item: ItineraryItem) => void;
  removeItem: (dayKey: string, placeId: string) => void;
  reorder: (dayKey: string, activeId: string, overId: string) => void; // chưa dùng, làm sau
}

export const useItineraryStore = create<ItineraryState>((set) => ({
  tripId: null,
  selectedDayKey: null,
  selectedPlaceId: null,
  itemsByDay: {},

  // Đổi sang trip khác thì reset dữ liệu
  initTrip: (tripId, firstDayKey) =>
    set((state) => {
      if (state.tripId !== tripId) {
        return { tripId, selectedDayKey: firstDayKey, selectedPlaceId: null, itemsByDay: {} };
      }
      return state.selectedDayKey ? state : { selectedDayKey: firstDayKey };
    }),

  // Đổi ngày thì bỏ chọn địa điểm
  setSelectedDayKey: (dayKey) => set({ selectedDayKey: dayKey, selectedPlaceId: null }),

  setSelectedPlaceId: (placeId) => set({ selectedPlaceId: placeId }),

  // Thêm vào cuối ngày, bỏ qua nếu địa điểm đã có trong ngày
  addItem: (dayKey, item) =>
    set((state) => {
      const current = state.itemsByDay[dayKey] ?? EMPTY_ITEMS;
      if (current.some((i) => i.place.id === item.place.id)) return state;
      return { itemsByDay: { ...state.itemsByDay, [dayKey]: [...current, item] } };
    }),

  removeItem: (dayKey, placeId) =>
    set((state) => {
      const current = state.itemsByDay[dayKey] ?? EMPTY_ITEMS;
      return {
        itemsByDay: { ...state.itemsByDay, [dayKey]: current.filter((i) => i.place.id !== placeId) },
        // Xóa đúng địa điểm đang chọn thì bỏ chọn
        selectedPlaceId: state.selectedPlaceId === placeId ? null : state.selectedPlaceId,
      };
    }),

  reorder: (dayKey, activeId, overId) =>
    set((state) => {
      const current = state.itemsByDay[dayKey] ?? EMPTY_ITEMS;
      const from = current.findIndex((i) => i.place.id === activeId);
      const to = current.findIndex((i) => i.place.id === overId);
      if (from < 0 || to < 0 || from === to) return state;
      return { itemsByDay: { ...state.itemsByDay, [dayKey]: arrayMove(current, from, to) } };
    }),
}));

// Danh sách địa điểm của ngày đang chọn (dùng cho TripMap)
export const useSelectedDayItems = () =>
  useItineraryStore((s) =>
    s.selectedDayKey ? (s.itemsByDay[s.selectedDayKey] ?? EMPTY_ITEMS) : EMPTY_ITEMS
  );