import type { ItineraryItemResponse } from '@/services/itinerary.service';

interface Coord {
  lat: number;
  lng: number;
}

function getCoord(item: ItineraryItemResponse): Coord | null {
  const { latitude, longitude } = item.place;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  return { lat: latitude, lng: longitude };
}

// Khoảng cách đường chim bay (km)
function haversineKm(a: Coord, b: Coord): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Số điểm có tọa độ (cần >= 3 thì tối ưu mới có ý nghĩa)
export function countRoutablePoints(items: ItineraryItemResponse[]): number {
  return items.filter((i) => getCoord(i) !== null).length;
}

/**
 * Nearest-neighbor: giữ điểm đầu làm xuất phát, lần lượt chọn điểm gần nhất.
 * Điểm thiếu tọa độ xếp cuối. Trả về mảng itemId theo thứ tự mới.
 */
export function optimizeDayOrder(dayItems: ItineraryItemResponse[]): number[] {
  const withCoord = dayItems.filter((i) => getCoord(i) !== null);
  const withoutCoord = dayItems.filter((i) => getCoord(i) === null);
  if (withCoord.length < 3) return dayItems.map((i) => i.itemId);

  const [first, ...rest] = withCoord;
  const route = [first];
  const remaining = [...rest];

  while (remaining.length > 0) {
    const last = getCoord(route[route.length - 1]) as Coord;
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((cand, idx) => {
      const dist = haversineKm(last, getCoord(cand) as Coord);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    route.push(...remaining.splice(bestIdx, 1));
  }

  return [...route, ...withoutCoord].map((i) => i.itemId);
}
