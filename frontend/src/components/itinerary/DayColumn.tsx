'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AddLocationBar, type LocationSuggestion } from '@/components/trip-workspace/AddLocationBar';
import type { ItineraryItem } from '@/types/itinerary';
import SortableTimelineItem from './SortableTimelineItem';

// Kết quả kéo thả: id item vừa kéo và hai item kề bên vị trí mới (null nếu ở đầu/cuối)
export interface ReorderPayload {
  movedId: string;
  prevId: string | null;
  nextId: string | null;
}

export interface UpdateMetaPayload {
  startTime: string | null;
  endTime: string | null;
  note: string | null;
}

// Chỉ nhận dữ liệu + callback, không biết gì về API/store: component cha tự nối
interface DayColumnProps {
  items: ItineraryItem[]; // địa điểm của ngày đang chọn, theo thứ tự; place.id là id duy nhất của item
  isLoading?: boolean;
  selectedPlaceId: string | number | null;
  suggestions: LocationSuggestion[];
  onSelectPlace: (id: string) => void;
  onHoverPlace: (id: string | null) => void;
  onReorder: (payload: ReorderPayload) => void;
  onRemove: (id: string) => void;
  onUpdateMeta: (id: string, payload: UpdateMetaPayload) => void;
  onAddPlace: (location: LocationSuggestion) => void;
  onAddBarFocus?: () => void; // để cha cuộn danh sách khi dropdown gợi ý mở
}

export default function DayColumn({
  items,
  isLoading = false,
  selectedPlaceId,
  suggestions,
  onSelectPlace,
  onHoverPlace,
  onReorder,
  onRemove,
  onUpdateMeta,
  onAddPlace,
  onAddBarFocus,
}: DayColumnProps) {
  // Chỉ cho mở một menu ⋯ tại một thời điểm
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);
  const toggleMenu = (id: string) => setOpenMenuId((current) => (current === id ? null : id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Click marker trên bản đồ -> cuộn tới thẻ tương ứng
  useEffect(() => {
    if (selectedPlaceId == null) return;
    document
      .getElementById(`itinerary-card-${selectedPlaceId}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedPlaceId]);

  const ids = items.map((i) => i.place.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;

    const reordered = arrayMove(ids, from, to);
    const movedId = reordered[to];
    if (!movedId) return;
    onReorder({
      movedId,
      prevId: reordered[to - 1] ?? null,
      nextId: reordered[to + 1] ?? null,
    });
  };

  return (
    <>
      {isLoading && <p className="mb-3 text-xs text-slate-500">Đang tải lịch trình...</p>}
      {!isLoading && items.length === 0 && (
        <p className="mb-3 text-xs text-slate-500">Chưa có địa điểm nào trong ngày này.</p>
      )}

      {/* id cố định để tránh lỗi hydration của dnd-kit (aria-describedby) */}
      <DndContext
        id="itinerary-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item, index) => (
              // Bọc ngoài để bắt hover (marker trên bản đồ phóng to) mà không sửa SortableTimelineItem
              <div
                key={item.place.id}
                onMouseEnter={() => onHoverPlace(item.place.id)}
                onMouseLeave={() => onHoverPlace(null)}
              >
                <SortableTimelineItem
                  item={item}
                  index={index}
                  isSelected={selectedPlaceId != null && String(selectedPlaceId) === item.place.id}
                  isMenuOpen={openMenuId === item.place.id}
                  onSelect={onSelectPlace}
                  onToggleMenu={toggleMenu}
                  onCloseMenu={closeMenu}
                  onRemove={onRemove}
                  onUpdateMeta={onUpdateMeta}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-3" onFocusCapture={onAddBarFocus}>
        <AddLocationBar suggestions={suggestions} onSelectLocation={onAddPlace} />
      </div>
    </>
  );
}