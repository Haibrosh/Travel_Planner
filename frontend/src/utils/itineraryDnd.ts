import type { ItineraryItemResponse } from '@/services/itinerary.service';

export interface ItemPosition {
  itemId: number;
  dayNumber: number | null;
  orderIndex: number; // 1-based trong ngày
}

export interface MovePlan {
  itemId: number;
  targetDayNumber: number;
  orderIndex: number; // vị trí mới (1-based) trong ngày đích
  prevItemId: number | null;
  nextItemId: number | null;
  positions: ItemPosition[]; // toàn bộ item bị đổi vị trí (ngày nguồn + ngày đích)
}

// id dùng cho dnd-kit
export const DAY_DROP_PREFIX = 'day-drop-';
export const itemDndId = (itemId: number) => `item-${itemId}`;
export const dayDndId = (dayNumber: number) => `day-${dayNumber}`;

export function parseItemDndId(id: string | number): number | null {
  const s = String(id);
  return s.startsWith('item-') ? Number(s.slice(5)) : null;
}

export function parseDayDndId(id: string | number): number | null {
  const s = String(id);
  return s.startsWith('day-') ? Number(s.slice(4)) : null;
}

// Danh sách item của một ngày (null = hàng chờ chưa xếp ngày), sắp theo orderIndex
export function getDayList(
  items: ItineraryItemResponse[],
  dayNumber: number | null
): ItineraryItemResponse[] {
  return items
    .filter((i) => i.dayNumber === dayNumber)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Chuyển 1 item sang (targetDayNumber, finalIndex).
 * finalIndex = vị trí 0-based của item SAU khi chuyển (Infinity = cuối ngày).
 * Trả về null nếu không có gì thay đổi.
 */
export function planMove(
  items: ItineraryItemResponse[],
  itemId: number,
  targetDayNumber: number,
  finalIndex: number
): MovePlan | null {
  const moved = items.find((i) => i.itemId === itemId);
  if (!moved) return null;

  const fromDay = moved.dayNumber;
  const sourceList = getDayList(items, fromDay);
  const originalIndex = sourceList.findIndex((i) => i.itemId === itemId);

  const targetWithout = getDayList(items, targetDayNumber).filter(
    (i) => i.itemId !== itemId
  );
  const index = Math.min(Math.max(0, finalIndex), targetWithout.length);

  if (fromDay === targetDayNumber && index === originalIndex) return null;

  const nextTarget = [
    ...targetWithout.slice(0, index),
    moved,
    ...targetWithout.slice(index),
  ];

  // Đánh lại orderIndex 1..n cho ngày đích
  const positions: ItemPosition[] = nextTarget.map((it, idx) => ({
    itemId: it.itemId,
    dayNumber: targetDayNumber,
    orderIndex: idx + 1,
  }));

  // Kéo sang ngày khác thì ngày nguồn cũng phải đánh lại số thứ tự
  if (fromDay !== targetDayNumber) {
    sourceList
      .filter((i) => i.itemId !== itemId)
      .forEach((it, idx) =>
        positions.push({ itemId: it.itemId, dayNumber: fromDay, orderIndex: idx + 1 })
      );
  }

  return {
    itemId,
    targetDayNumber,
    orderIndex: index + 1,
    prevItemId: nextTarget[index - 1]?.itemId ?? null,
    nextItemId: nextTarget[index + 1]?.itemId ?? null,
    positions,
  };
}

// Áp các vị trí mới lên danh sách (dùng cho optimistic update)
export function applyPositions(
  items: ItineraryItemResponse[],
  positions: ItemPosition[]
): ItineraryItemResponse[] {
  const map = new Map(positions.map((p) => [p.itemId, p]));
  return items.map((it) => {
    const p = map.get(it.itemId);
    return p
      ? { ...it, dayNumber: p.dayNumber, orderIndex: p.orderIndex, positionIndex: p.orderIndex }
      : it;
  });
}

// Sắp cả ngày theo orderedIds: tạo chuỗi MovePlan chạy tuần tự (dùng cho "Tối ưu lộ trình")
export function planDayReorder(
  items: ItineraryItemResponse[],
  dayNumber: number,
  orderedIds: number[]
): MovePlan[] {
  const plans: MovePlan[] = [];
  let simulated = items;
  orderedIds.forEach((id, index) => {
    const plan = planMove(simulated, id, dayNumber, index);
    if (plan) {
      plans.push(plan);
      simulated = applyPositions(simulated, plan.positions);
    }
  });
  return plans;
}
