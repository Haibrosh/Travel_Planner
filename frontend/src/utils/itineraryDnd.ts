import { arrayMove } from '@dnd-kit/sortable';
import type { ItineraryItemResponse } from '@/services/itinerary.service';

// Prefix id của chip ngày (droppable), vd: 'day-2'
export const DAY_DROP_PREFIX = 'day-';

// Vị trí mới của một item sau khi kéo thả
export interface ItemPositionChange {
  itemId: number;
  dayNumber: number;
  orderIndex: number; // bắt đầu từ 1
}

// Dữ liệu truyền vào mutation (PUT .../items/{itemId}/reorder)
export interface MovedItemPayload {
  itemId: number;
  targetDayNumber: number;
  orderIndex: number;
  prevItemId: number | null;
  nextItemId: number | null;
}

export interface DragMoveResult {
  moved: MovedItemPayload;
  changes: ItemPositionChange[]; // mọi item bị ảnh hưởng (ngày nguồn + ngày đích)
}

// Lấy các item của một ngày, đã sắp theo thứ tự
function itemsOfDay(items: ItineraryItemResponse[], day: number): ItineraryItemResponse[] {
  return items
    .filter((i) => i.dayNumber === day)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

// Đánh lại orderIndex 1..n cho một danh sách trong một ngày
function renumber(list: ItineraryItemResponse[], day: number): ItemPositionChange[] {
  return list.map((item, idx) => ({ itemId: item.itemId, dayNumber: day, orderIndex: idx + 1 }));
}

interface ComputeParams {
  items: ItineraryItemResponse[]; // toàn bộ lịch trình của trip
  activeId: string | number;      // id thẻ đang kéo (itemId)
  overId: string | number;        // id thẻ / chip ngày đang thả lên
}

/**
 * Tính vị trí mới sau khi thả. Trả về null nếu không có gì thay đổi.
 * - Thả lên thẻ cùng ngày  -> đổi thứ tự trong ngày
 * - Thả lên chip "Ngày N"  -> chuyển sang cuối Ngày N
 * - Thả lên thẻ ngày khác  -> chèn vào vị trí của thẻ đó (hỗ trợ sẵn)
 */
export function computeDragResult({ items, activeId, overId }: ComputeParams): DragMoveResult | null {
  const activeItem = items.find((i) => String(i.itemId) === String(activeId));
  if (!activeItem || activeItem.dayNumber === null) return null;

  const sourceDay = activeItem.dayNumber;
  const overKey = String(overId);

  let targetDay: number;
  let newTargetList: ItineraryItemResponse[];

  if (overKey.startsWith(DAY_DROP_PREFIX)) {
    // Thả lên chip ngày -> xuống cuối ngày đó
    targetDay = Number(overKey.slice(DAY_DROP_PREFIX.length));
    if (!Number.isFinite(targetDay) || targetDay < 1 || targetDay === sourceDay) return null;
    newTargetList = [...itemsOfDay(items, targetDay), activeItem];
  } else {
    const overItem = items.find((i) => String(i.itemId) === overKey);
    if (!overItem || overItem.dayNumber === null || overItem.itemId === activeItem.itemId) {
      return null;
    }
    targetDay = overItem.dayNumber;
    const targetList = itemsOfDay(items, targetDay);

    if (targetDay === sourceDay) {
      // Cùng ngày: arrayMove theo index
      const from = targetList.findIndex((i) => i.itemId === activeItem.itemId);
      const to = targetList.findIndex((i) => i.itemId === overItem.itemId);
      if (from < 0 || to < 0 || from === to) return null;
      newTargetList = arrayMove(targetList, from, to);
    } else {
      // Khác ngày: chèn vào trước thẻ đang thả lên
      const overIdx = targetList.findIndex((i) => i.itemId === overItem.itemId);
      newTargetList = [...targetList];
      newTargetList.splice(overIdx, 0, activeItem);
    }
  }

  const newIndex = newTargetList.findIndex((i) => i.itemId === activeItem.itemId);

  const changes = renumber(newTargetList, targetDay);
  if (targetDay !== sourceDay) {
    // Ngày nguồn bị mất 1 item -> đánh lại số thứ tự cho liền mạch
    const newSourceList = itemsOfDay(items, sourceDay).filter((i) => i.itemId !== activeItem.itemId);
    changes.push(...renumber(newSourceList, sourceDay));
  }

  return {
    moved: {
      itemId: activeItem.itemId,
      targetDayNumber: targetDay,
      orderIndex: newIndex + 1,
      prevItemId: newTargetList[newIndex - 1]?.itemId ?? null,
      nextItemId: newTargetList[newIndex + 1]?.itemId ?? null,
    },
    changes,
  };
}

// Áp các thay đổi vào danh sách (dùng cho optimistic update của React Query)
export function applyChangesToItems(
  items: ItineraryItemResponse[],
  changes: ItemPositionChange[]
): ItineraryItemResponse[] {
  const map = new Map(changes.map((c) => [c.itemId, c]));
  return items.map((item) => {
    const change = map.get(item.itemId);
    if (!change) return item;
    return {
      ...item,
      dayNumber: change.dayNumber,
      orderIndex: change.orderIndex,
      positionIndex: change.orderIndex,
    };
  });
}

/**
 * Chuyển "thứ tự hiện tại" -> "thứ tự đích" thành chuỗi lệnh move tuần tự.
 * Xử lý từ trên xuống nên đúng dù backend dịch chuyển các item khác hay không.
 */
export function buildSequentialMoves(
  current: ItineraryItemResponse[],
  target: ItineraryItemResponse[]
): Omit<MovedItemPayload, 'targetDayNumber'>[] {
  const list = [...current];
  const moves: Omit<MovedItemPayload, 'targetDayNumber'>[] = [];

  target.forEach((targetItem, i) => {
    if (list[i]?.itemId === targetItem.itemId) return;
    const from = list.findIndex((x) => x.itemId === targetItem.itemId);
    if (from < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(i, 0, moved);
    moves.push({
      itemId: moved.itemId,
      orderIndex: i + 1,
      prevItemId: list[i - 1]?.itemId ?? null,
      nextItemId: list[i + 1]?.itemId ?? null,
    });
  });

  return moves;
}