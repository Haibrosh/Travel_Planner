'use client';

import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TripMapLoader from '@/components/map/TripMapLoader';
import SelectedDebug from '@/components/map/SelectedDebug';
import placesData from '@/mocks/places.json';
import type { Place } from '@/types/place';
import { useMapStore } from '@/store/useMapStore';
import { useMapHoverStore } from '@/store/useMapHoverStore';

const ALL_PLACES: Place[] = placesData;

// Giả lập 2 "ngày" để thử fitBounds khi đổi ngày
const INITIAL_DAYS: Place[][] = [ALL_PLACES.slice(0, 3), ALL_PLACES.slice(3)];

interface SortableRowProps {
  place: Place;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

// Một dòng kéo thả được; chỉ tay nắm ⋮⋮ mới kéo, bấm vào dòng vẫn là chọn địa điểm
function SortableRow({ place, index, isSelected, onSelect, onHover }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(place.id)}
      className={`relative flex cursor-pointer items-center gap-2 rounded-xl border px-2 py-2.5 text-sm ${
        isDragging ? 'z-10 opacity-80 shadow-md' : ''
      } ${
        isSelected
          ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()} // bấm tay nắm không tính là chọn dòng
        aria-label={`Kéo để đổi thứ tự ${place.name}`}
        className="shrink-0 cursor-grab touch-none rounded px-1 text-zinc-400 hover:text-zinc-700 active:cursor-grabbing dark:hover:text-zinc-200"
      >
        ⋮⋮
      </button>
      <span className="truncate">
        {index + 1}. {place.name}
      </span>
    </li>
  );
}

export default function MapSpikePage() {
  const [days, setDays] = useState<Place[][]>(INITIAL_DAYS);
  const [dayIndex, setDayIndex] = useState(0);

  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = useMapStore((s) => s.setSelectedPlaceId);
  const setHoveredPlaceId = useMapHoverStore((s) => s.setHoveredPlaceId);

  const places = days[dayIndex];

  // distance: 5 để click nhẹ không bị tính là kéo
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const changeDay = (index: number) => {
    setDayIndex(index);
    setSelectedPlaceId(null); // đổi ngày thì bỏ chọn
    setHoveredPlaceId(null);
  };

  // Thả xong: đổi vị trí trong ngày đang chọn (marker tự đánh số lại theo thứ tự mới)
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setDays((prev) =>
      prev.map((list, i) => {
        if (i !== dayIndex) return list;
        const from = list.findIndex((p) => p.id === active.id);
        const to = list.findIndex((p) => p.id === over.id);
        return from < 0 || to < 0 ? list : arrayMove(list, from, to);
      })
    );
  };

  return (
    <main className="p-4">
      <h1 className="mb-4 text-xl font-semibold">TripMap spike</h1>
      <SelectedDebug />

      <div className="mb-3 flex items-center gap-2 text-xs">
        {days.map((_, i) => (
          <button
            key={i}
            onClick={() => changeDay(i)}
            className={`rounded-lg px-3 py-1.5 font-semibold ${
              dayIndex === i
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            Ngày {i + 1}
          </button>
        ))}
        <span className="text-zinc-500 dark:text-zinc-400">Kéo ⋮⋮ để đổi thứ tự</span>
      </div>

      <div className="flex gap-4">
        {/* Danh sách giả lập PlaceCard: hover/click để thử đồng bộ, kéo ⋮⋮ để đổi thứ tự */}
        <DndContext
          id="map-spike-dnd" // id cố định để tránh lệch hydration của aria-describedby
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <ul className="w-64 shrink-0 space-y-2">
              {places.map((place, index) => (
                <SortableRow
                  key={place.id}
                  place={place}
                  index={index}
                  isSelected={selectedPlaceId === place.id}
                  onSelect={setSelectedPlaceId}
                  onHover={setHoveredPlaceId}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <div className="h-[500px] flex-1">
          <TripMapLoader places={places} />
        </div>
      </div>
    </main>
  );
}