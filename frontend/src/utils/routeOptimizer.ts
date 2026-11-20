import type { ItineraryItemResponse } from '@/services/itinerary.service';

// Khoảng cách Haversine (km)
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function hasCoords(item: ItineraryItemResponse): boolean {
  const { latitude, longitude } = item.place;
  return (
    latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined
  );
}

/**
 * Tối ưu thô theo "láng giềng gần nhất" (greedy).
 * Giữ nguyên điểm đầu tiên làm xuất phát; điểm thiếu tọa độ xếp cuối, giữ thứ tự cũ.
 */
export function optimizeDayOrder(items: ItineraryItemResponse[]): ItineraryItemResponse[] {
  const withCoords = items.filter(hasCoords);
  const withoutCoords = items.filter((i) => !hasCoords(i));
  if (withCoords.length < 3) return items;

  const remaining = [...withCoords];
  const result: ItineraryItemResponse[] = [remaining.shift() as ItineraryItemResponse];

  while (remaining.length > 0) {
    const last = result[result.length - 1].place;
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((cand, idx) => {
      const d = distanceKm(
        Number(last.latitude),
        Number(last.longitude),
        Number(cand.place.latitude),
        Number(cand.place.longitude)
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    result.push(remaining.splice(bestIdx, 1)[0]);
  }

  return [...result, ...withoutCoords];
}