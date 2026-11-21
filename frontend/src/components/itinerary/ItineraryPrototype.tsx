'use client';

import { useMemo, useRef } from 'react';
import type { LocationSuggestion } from '@/components/trip-workspace/AddLocationBar';
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
import DayColumn, { type ReorderPayload, type UpdateMetaPayload } from './DayColumn';
import { toTimelineItem } from './ItineraryMappers';

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
    setSelectedPlaceId(null);
    setHoveredPlaceId(null);
    setActiveDayNumber(index + 1);
  };

  // Chọn địa điểm: thêm vào ngày đang chọn, backend tự xếp ở cuối ngày
  const handleAddPlace = (location: LocationSuggestion) => {
    const place = placePool.find((p) => String(p.placeId) === location.id);
    if (!place) return;
    addItem.mutate({ placeId: place.placeId, dayNumber: activeDayNumber, placeSnapshot: place });
  };

  const handleRemove = (id: string) => {
    deleteItem.mutate(Number(id));
    if (selectedPlaceId != null && String(selectedPlaceId) === id) setSelectedPlaceId(null);
    setHoveredPlaceId(null);
  };

  const handleUpdateMeta = (id: string, payload: UpdateMetaPayload) => {
    updateItem.mutate({
      itemId: Number(id),
      startTime: payload.startTime,
      endTime: payload.endTime,
      note: payload.note,
    });
  };

  // Kéo thả trong ngày: chỉ báo item liền trước/sau vị trí mới, backend tự tính orderIndex
  const handleReorder = ({ movedId, prevId, nextId }: ReorderPayload) => {
    reorderItem.mutate({
      itemId: Number(movedId),
      dayNumber: activeDayNumber,
      prevItemId: prevId ? Number(prevId) : null,
      nextItemId: nextId ? Number(nextId) : null,
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
        {/* key theo ngày: đổi ngày thì DayColumn khởi tạo lại (đóng menu ⋯, reset DnD) */}
        <DayColumn
          key={activeDayNumber}
          items={timelineItems}
          isLoading={isLoading}
          selectedPlaceId={selectedPlaceId}
          suggestions={suggestions}
          onSelectPlace={setSelectedPlaceId}
          onHoverPlace={setHoveredPlaceId}
          onReorder={handleReorder}
          onRemove={handleRemove}
          onUpdateMeta={handleUpdateMeta}
          onAddPlace={handleAddPlace}
          onAddBarFocus={handleAddBarFocus}
        />
      </div>
    </section>
  );
}