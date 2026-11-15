'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { TripDateFilter } from '@/components/trip-workspace/TripDateFilter';
import { useDayItinerary } from '@/hooks/useDayItinerary';
import {
  useAddItineraryItemMutation,
  useDeleteItineraryItemMutation,
  useUpdateItineraryItemMutation,
} from '@/hooks/useItinerary';
import { usePlaces } from '@/hooks/usePlaces';
import { useReorderItineraryItem } from '@/hooks/useReorderItineraryItem';
import { useMapHoverStore } from '@/store/useMapHoverStore';
import { useMapStore } from '@/store/useMapStore';
import type { TripResponse } from '@/types/trip';
import { toTimelineItem } from './ItineraryMappers';
import SortableTimelineItem from './SortableTimelineItem';

interface ItineraryPrototypeProps {
  trip: Pick<TripResponse, 'tripId' | 'startDate' | 'endDate' | 'provinceCode'>;
}

export default function ItineraryPrototype({ trip }: ItineraryPrototypeProps) {
  const { days, activeDayNumber, setActiveDayNumber, dayItems, isLoading } = useDayItinerary(trip);

  // Chọn thẻ và hover dùng chung store với bản đồ
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = useMapStore((s) => s.setSelectedPlaceId);
  const setHoveredPlaceId = useMapHoverStore((s) => s.setHoveredPlaceId);

  const addItem = useAddItineraryItemMutation(trip.tripId);
  const deleteItem = useDeleteItineraryItemMutation(trip.tripId);
  const updateItem = useUpdateItineraryItemMutation(trip.tripId);
  const reorderItem = useReorderItineraryItem(trip.tripId);

  // Gợi ý địa điểm theo tỉnh của chuyến đi; AddLocationBar tự lọc theo từ khóa gõ vào
  const { data: placesPage } = usePlaces({
    destinationId: trip.provinceCode,
    sort: 'popular',
    page: 1,
    size: 50,
  });
  const placePool = useMemo(() => placesPage?.content ?? [], [placesPage]);

  const timelineItems = useMemo(() => dayItems.map(toTimelineItem), [dayItems]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Chỉ cho mở một menu ⋯ tại một thời điểm
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);

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

  const activeDay = days[activeDayNumber - 1];
  if (!activeDay) {
    return <p className="p-5 text-xs text-slate-500">Chuyến đi chưa có ngày hợp lệ.</p>;
  }

  // Gợi ý: các địa điểm chưa có trong ngày đang chọn
  const suggestions: LocationSuggestion[] = placePool
    .filter((p) => !dayItems.some((i) => i.placeId === p.placeId))
    .map((p) => ({ id: String(p.placeId), name: p.name, address: p.address }));

  const handleChangeDay = (dayKey: string) => {
    const index = days.findIndex((d) => d.key === dayKey);
    if (index < 0) return;
    closeMenu();
    setSelectedPlaceId(null);
    setHoveredPlaceId(null);
    setActiveDayNumber(index + 1);
  };

  // Chọn địa điểm: thêm vào ngày đang chọn, backend tự xếp ở cuối ngày
  const handleSelectLocation = (location: LocationSuggestion) => {
    const place = placePool.find((p) => String(p.placeId) === location.id);
    if (!place) return;
    addItem.mutate({ placeId: place.placeId, dayNumber: activeDayNumber, placeSnapshot: place });
  };

  const handleToggleMenu = (id: string) =>
    setOpenMenuId((current) => (current === id ? null : id));

  const handleRemove = (id: string) => {
    deleteItem.mutate(Number(id));
    if (selectedPlaceId != null && String(selectedPlaceId) === id) setSelectedPlaceId(null);
    setHoveredPlaceId(null);
  };

  const handleUpdateMeta = (
    id: string,
    payload: { startTime: string | null; endTime: string | null; note: string | null }
  ) => {
    updateItem.mutate({
      itemId: Number(id),
      startTime: payload.startTime,
      endTime: payload.endTime,
      note: payload.note,
    });
  };

  // Kéo thả trong ngày: chỉ báo item liền trước/sau vị trí mới, backend tự tính orderIndex
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = timelineItems.map((i) => i.place.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;

    const reordered = arrayMove(dayItems, from, to);
    const moved = reordered[to];
    if (!moved) return;
    reorderItem.mutate({
      itemId: moved.itemId,
      dayNumber: activeDayNumber,
      prevItemId: reordered[to - 1]?.itemId ?? null,
      nextItemId: reordered[to + 1]?.itemId ?? null,
    });
  };

  // Dropdown gợi ý nằm ở cuối danh sách: cuộn xuống để thấy hết danh sách
  const handleAddBarFocus = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  };

  return (
    <section className="flex h-full flex-col">
      <div className="shrink-0 px-5 pb-4 pt-6">
        <TripDateFilter
          currentDate={activeDay.label}
          days={days}
          selectedKey={activeDay.key}
          onDateChange={handleChangeDay}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-6">
        {isLoading && <p className="mb-3 text-xs text-slate-500">Đang tải lịch trình...</p>}
        {!isLoading && timelineItems.length === 0 && (
          <p className="mb-3 text-xs text-slate-500">Chưa có địa điểm nào trong ngày này.</p>
        )}

        {/* id cố định để tránh lỗi hydration của dnd-kit (aria-describedby) */}
        <DndContext
          id="itinerary-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={timelineItems.map((i) => i.place.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {timelineItems.map((item, index) => (
                // Bọc ngoài để bắt hover (marker trên bản đồ phóng to) mà không sửa SortableTimelineItem
                <div
                  key={item.place.id}
                  onMouseEnter={() => setHoveredPlaceId(item.place.id)}
                  onMouseLeave={() => setHoveredPlaceId(null)}
                >
                  <SortableTimelineItem
                    item={item}
                    index={index}
                    isSelected={selectedPlaceId != null && String(selectedPlaceId) === item.place.id}
                    isMenuOpen={openMenuId === item.place.id}
                    onSelect={setSelectedPlaceId}
                    onToggleMenu={handleToggleMenu}
                    onCloseMenu={closeMenu}
                    onRemove={handleRemove}
                    onUpdateMeta={handleUpdateMeta}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-3" onFocusCapture={handleAddBarFocus}>
          <AddLocationBar suggestions={suggestions} onSelectLocation={handleSelectLocation} />
        </div>
      </div>
    </section>
  );
}