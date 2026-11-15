import { CATEGORY_LABEL_MAP } from '@/services/explore.service';
import type { ItineraryItemResponse } from '@/services/itinerary.service';
import type { ItineraryItem } from '@/types/itinerary';
import type { Place as MapPlace } from '@/types/place';

// 'HH:mm:ss' (backend) -> 'HH:mm' (khớp input type="time")
const toHHmm = (time?: string | null) => (time ? time.slice(0, 5) : undefined);

// Item API -> item hiển thị trong timeline.
// place.id = itemId (không phải placeId) để dnd-kit, marker và việc chọn thẻ phân biệt từng item.
export function toTimelineItem(item: ItineraryItemResponse): ItineraryItem {
  const { place } = item;
  return {
    place: {
      id: String(item.itemId),
      name: place.name,
      lat: Number(place.latitude ?? 0), // chỉ dùng cho bản đồ qua toMapPlaces (có lọc thiếu tọa độ)
      lng: Number(place.longitude ?? 0),
      category: place.category,
    },
    tags: [CATEGORY_LABEL_MAP[place.category] ?? place.subcategory ?? 'Điểm tham quan'],
    note: item.note ?? undefined,
    startTime: toHHmm(item.startTime),
    endTime: toHHmm(item.endTime),
    imageUrl: place.photoUrl,
  };
}

// Item API -> điểm trên bản đồ (bỏ item thiếu tọa độ)
export function toMapPlaces(items: ItineraryItemResponse[]): MapPlace[] {
  return items
    .filter((i) => i.place.latitude != null && i.place.longitude != null)
    .map((i) => ({
      id: String(i.itemId),
      name: i.place.name,
      lat: Number(i.place.latitude),
      lng: Number(i.place.longitude),
      category: i.place.category,
    }));
}