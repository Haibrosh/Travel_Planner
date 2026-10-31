'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import placesData from '@/mocks/places.json';
import { createMockItem } from '@/mocks/visitMeta';
import { AddLocationBar, type LocationSuggestion } from '@/components/trip-workspace/AddLocationBar';
import { TripDateFilter } from '@/components/trip-workspace/TripDateFilter';
import type { Place } from '@/types/place';
import type { TripResponse } from '@/types/trip';
import { EMPTY_ITEMS, useItineraryStore } from '@/store/useItineraryStore';
import { getCategoryLabel } from '@/utils/placeCategory';
import { getTripDays } from '@/utils/tripDays';
import SortableTimelineItem from './SortableTimelineItem';

// Nguồn gợi ý mock; sau này thay bằng API /places/search
const ALL_PLACES: Place[] = placesData;

interface ItineraryPrototypeProps {
  trip: Pick<TripResponse, 'tripId' | 'startDate' | 'endDate'>;
}

export default function ItineraryPrototype({ trip }: ItineraryPrototypeProps) {
  const days = useMemo(() => getTripDays(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);

  const selectedDayKey = useItineraryStore((s) => s.selectedDayKey);
  const selectedPlaceId = useItineraryStore((s) => s.selectedPlaceId);
  const initTrip = useItineraryStore((s) => s.initTrip);
  const setSelectedDayKey = useItineraryStore((s) => s.setSelectedDayKey);
  const setSelectedPlaceId = useItineraryStore((s) => s.setSelectedPlaceId);
  const addItem = useItineraryStore((s) => s.addItem);
  const removeItem = useItineraryStore((s) => s.removeItem);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Chỉ cho mở một menu ⋯ tại một thời điểm
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  // Ngày đang hiển thị (fallback về ngày đầu trước khi store được khởi tạo)
  const activeDay = days.find((d) => d.key === selectedDayKey) ?? days[0];
  const activeDayKey = activeDay?.key ?? '';
  const items = useItineraryStore((s) => s.itemsByDay[activeDayKey] ?? EMPTY_ITEMS);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (days.length > 0) initTrip(String(trip.tripId), days[0].key);
  }, [trip.tripId, days, initTrip]);

  // Click marker trên bản đồ -> cuộn tới thẻ tương ứng
  useEffect(() => {
    if (selectedPlaceId == null) return;
    document
      .getElementById(`itinerary-card-${selectedPlaceId}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedPlaceId]);

  if (!activeDay) {
    return <p className="p-5 text-xs text-slate-500">Chuyến đi chưa có ngày hợp lệ.</p>;
  }

  // Gợi ý: các địa điểm chưa có trong ngày; address tạm hiển thị category
  const suggestions: LocationSuggestion[] = ALL_PLACES.filter(
    (p) => !items.some((i) => i.place.id === p.id)
  ).map((p) => ({ id: p.id, name: p.name, address: getCategoryLabel(p.category) }));

  const handleChangeDay = (dayKey: string) => {
    closeMenu();
    setSelectedDayKey(dayKey);
  };

  const handleSelectLocation = (location: LocationSuggestion) => {
    const place = ALL_PLACES.find((p) => p.id === location.id);
    if (place) addItem(activeDayKey, createMockItem(place));
  };

  const handleToggleMenu = (placeId: string) =>
    setOpenMenuId((current) => (current === placeId ? null : placeId));

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
        {items.length === 0 && (
          <p className="mb-3 text-xs text-slate-500">Chưa có địa điểm nào trong ngày này.</p>
        )}

        {/* id cố định để tránh lỗi hydration của dnd-kit (aria-describedby) */}
        {/* TODO: xử lý đổi thứ tự khi thả (onDragEnd -> reorder) sẽ làm sau */}
        <DndContext id="itinerary-dnd" sensors={sensors} collisionDetection={closestCenter}>
          <SortableContext items={items.map((i) => i.place.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableTimelineItem
                  key={item.place.id}
                  item={item}
                  index={index}
                  isSelected={selectedPlaceId === item.place.id}
                  isMenuOpen={openMenuId === item.place.id}
                  onSelect={setSelectedPlaceId}
                  onToggleMenu={handleToggleMenu}
                  onCloseMenu={closeMenu}
                  onRemove={(placeId) => removeItem(activeDayKey, placeId)}
                />
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