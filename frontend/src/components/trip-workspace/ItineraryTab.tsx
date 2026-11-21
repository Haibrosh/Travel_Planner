'use client';

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TripResponse } from '@/types/trip';
import type { Place as ExplorePlace } from '@/types/explore';
import type { ItineraryItemResponse } from '@/services/itinerary.service';
import { useTripUiStore } from '@/store/useTripUiStore';
import { useMapStore } from '@/store/useMapStore';
import { useMapHoverStore } from '@/store/useMapHoverStore';
import {
  useAddItineraryItemMutation,
  useDeleteItineraryItemMutation,
  useItineraryQuery,
  useOptimizeDayRouteMutation,
  useReorderItineraryMutation,
  useUpdateItineraryItemMutation,
} from '@/hooks/useItinerary';
import {
  CATEGORY_LABEL_MAP,
  getPlaceFallbackImage,
} from '@/services/explore.service';
import { ItineraryDayHeader } from './ItineraryDayHeader';
import { TripActivityCard } from '@/components/cards/TripActivityCard';
import { AddLocationBar, LocationSuggestion } from './AddLocationBar';

export interface ItineraryItem {
  id: string | number;
  title: string;
  timeRange: string;
  category: string[];
  note?: string;
  imageUrl?: string;
  address?: string;
  rating?: number;
  isVisited?: boolean;
  top?: string;
  left?: string;
  rawItem?: ItineraryItemResponse;
}

export interface ItineraryTabProps {
  trip: TripResponse;
  currentDate?: string;
  activities?: ItineraryItem[];
  selectedPlaceId?: string | number | null;
  onSelectActivity?: (act: ItineraryItem) => void;
  onAddLocation?: (loc: LocationSuggestion) => void;
  onReorderActivities?: (newActivities: ItineraryItem[]) => void;
  onUpdateActivity?: (
    id: string | number,
    updatedData: { timeRange?: string; note?: string }
  ) => void;
  onDeleteActivity?: (id: string | number) => void;
  onOpenUpdateModal?: (act: ItineraryItem) => void;
  isFilteredByMap?: boolean;
  onToggleMapFilter?: () => void;
  onOptimizeRoute?: () => void;
}

function mapApiItemToActivity(item: ItineraryItemResponse): ItineraryItem {
  const { place } = item;
  const timeRange =
    item.startTime && item.endTime
      ? `${item.startTime} - ${item.endTime}`
      : item.startTime
        ? `Từ ${item.startTime}`
        : item.endTime
          ? `Đến ${item.endTime}`
          : 'Cả ngày';

  return {
    id: item.itemId,
    title: place.name,
    timeRange,
    category: [
      CATEGORY_LABEL_MAP[place.category] || place.subcategory || 'Tham quan',
    ],
    note: item.note ?? '',
    imageUrl: place.photoUrl || getPlaceFallbackImage(place.category),
    address: place.address || '',
    rating: place.rating ?? undefined,
    isVisited: false,
    rawItem: item,
  };
}

interface SortableActivityRowProps {
  act: ItineraryItem;
  idx: number;
  selectedPlaceId?: string | number | null;
  onSelectActivity?: (act: ItineraryItem) => void;
  onHoverPlace?: (placeId: string | null) => void;
  onUpdateActivity?: (
    id: string | number,
    updatedData: { timeRange?: string; note?: string }
  ) => void;
  onDeleteActivity?: (id: string | number) => void;
  onOpenUpdateModal?: (act: ItineraryItem) => void;
}

const SortableActivityRow: React.FC<SortableActivityRowProps> = ({
  act,
  idx,
  selectedPlaceId,
  onSelectActivity,
  onHoverPlace,
  onUpdateActivity,
  onDeleteActivity,
  onOpenUpdateModal,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(act.id) });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const placeKey = act.rawItem ? String(act.rawItem.place.placeId) : String(act.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => onHoverPlace?.(placeKey)}
      onMouseLeave={() => onHoverPlace?.(null)}
    >
      <TripActivityCard
        index={idx + 1}
        title={act.title}
        timeRange={act.timeRange}
        tags={act.category}
        note={act.note}
        imageUrl={act.imageUrl}
        isSelected={selectedPlaceId === act.id || selectedPlaceId === placeKey}
        onClick={() => onSelectActivity?.(act)}
        onUpdateActivity={(data) => onUpdateActivity?.(act.id, data)}
        onDeleteActivity={() => onDeleteActivity?.(act.id)}
        onOpenUpdateModal={() => onOpenUpdateModal?.(act)}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

interface DroppableItineraryZoneProps {
  activities: ItineraryItem[];
  isDraggingActive: boolean;
  selectedPlaceId?: string | number | null;
  onSelectActivity?: (act: ItineraryItem) => void;
  onHoverPlace?: (placeId: string | null) => void;
  onUpdateActivity?: (
    id: string | number,
    updatedData: { timeRange?: string; note?: string }
  ) => void;
  onDeleteActivity?: (id: string | number) => void;
  onOpenUpdateModal?: (act: ItineraryItem) => void;
}

const DroppableItineraryZone: React.FC<DroppableItineraryZoneProps> = ({
  activities,
  isDraggingActive,
  selectedPlaceId,
  onSelectActivity,
  onHoverPlace,
  onUpdateActivity,
  onDeleteActivity,
  onOpenUpdateModal,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'itinerary-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 p-2 rounded-2xl transition-all duration-200 ${
        isOver
          ? 'bg-teal-50/90 border-2 border-dashed border-teal-500 ring-2 ring-teal-500/20'
          : isDraggingActive
            ? 'bg-teal-50/40 border-2 border-dashed border-teal-300/70'
            : 'border-2 border-transparent'
      }`}
    >
      <SortableContext
        items={activities.map((act) => String(act.id))}
        strategy={verticalListSortingStrategy}
      >
        {activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <p className="text-xs font-medium text-slate-500">
              Chưa có hoạt động nào trong ngày này.
            </p>
          </div>
        ) : (
          activities.map((act, idx) => (
            <SortableActivityRow
              key={act.id}
              act={act}
              idx={idx}
              selectedPlaceId={selectedPlaceId}
              onSelectActivity={onSelectActivity}
              onHoverPlace={onHoverPlace}
              onUpdateActivity={onUpdateActivity}
              onDeleteActivity={onDeleteActivity}
              onOpenUpdateModal={onOpenUpdateModal}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
};

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  trip,
  currentDate,
  activities: externalActivities,
  selectedPlaceId: externalSelectedPlaceId,
  onSelectActivity,
  onAddLocation,
  onReorderActivities,
  onUpdateActivity,
  onDeleteActivity,
  onOpenUpdateModal,
  isFilteredByMap: externalFilteredByMap,
  onToggleMapFilter,
  onOptimizeRoute,
}) => {
  const { selectedDayNumber, setSelectedDayNumber } = useTripUiStore();
  const storeSelectedPlaceId = useMapStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = useMapStore((s) => s.setSelectedPlaceId);
  const setHoveredPlaceId = useMapHoverStore((s) => s.setHoveredPlaceId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOverDropzone, setIsOverDropzone] = useState(false);
  const [localFilteredByMap, setLocalFilteredByMap] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const daysList = useMemo(() => {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const list: { dayNum: number; dateLabel: string }[] = [];
      const current = new Date(start);
      let dayNum = 1;
      while (current <= end && dayNum <= 30) {
        list.push({
          dayNum,
          dateLabel: current.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
          }),
        });
        current.setDate(current.getDate() + 1);
        dayNum++;
      }
      return list.length > 0
        ? list
        : [{ dayNum: 1, dateLabel: currentDate || trip.startDate }];
    } catch {
      return [{ dayNum: 1, dateLabel: currentDate || trip.startDate }];
    }
  }, [trip.startDate, trip.endDate, currentDate]);

  const activeDay = useMemo(
    () => daysList.find((d) => d.dayNum === selectedDayNumber) ?? daysList[0],
    [daysList, selectedDayNumber]
  );
  const activeDayNum = activeDay.dayNum;

  const { data: itineraryItems = [], isLoading } = useItineraryQuery(trip.tripId);
  const addItemMutation = useAddItineraryItemMutation(trip.tripId);
  const deleteItemMutation = useDeleteItineraryItemMutation(trip.tripId);
  const updateItemMutation = useUpdateItineraryItemMutation(trip.tripId);
  const reorderMutation = useReorderItineraryMutation(trip.tripId);
  const optimizeRouteMutation = useOptimizeDayRouteMutation(trip.tripId);

  const dayApiItems = useMemo(
    () =>
      itineraryItems
        .filter((item) => item.dayNumber === activeDayNum)
        .sort((a, b) => a.positionIndex - b.positionIndex),
    [itineraryItems, activeDayNum]
  );

  const computedActivities = useMemo<ItineraryItem[]>(() => {
    if (externalActivities) return externalActivities;
    return dayApiItems.map(mapApiItemToActivity);
  }, [externalActivities, dayApiItems]);

  const isFiltered = externalFilteredByMap ?? localFilteredByMap;
  const displayedActivities = isFiltered
    ? computedActivities.slice(0, 1)
    : computedActivities;

  const activeIndex = activeId
    ? displayedActivities.findIndex((item) => String(item.id) === activeId)
    : -1;
  const activeItem = activeIndex >= 0 ? displayedActivities[activeIndex] : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    setIsOverDropzone(Boolean(event.over));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsOverDropzone(false);

    if (!over || active.id === over.id) return;

    const oldIndex = displayedActivities.findIndex(
      (item) => String(item.id) === String(active.id)
    );
    const newIndex = displayedActivities.findIndex(
      (item) => String(item.id) === String(over.id)
    );

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const reordered = arrayMove(displayedActivities, oldIndex, newIndex);
    onReorderActivities?.(reordered);

    if (!externalActivities && dayApiItems.length > 0) {
      const reorderedApi = arrayMove(dayApiItems, oldIndex, newIndex).map(
        (item, idx) => ({
          ...item,
          orderIndex: idx + 1,
          positionIndex: idx + 1,
        })
      );
      const moved = reorderedApi[newIndex];
      const prevItem = newIndex > 0 ? reorderedApi[newIndex - 1] : null;
      const nextItem =
        newIndex < reorderedApi.length - 1 ? reorderedApi[newIndex + 1] : null;
      const otherDays = itineraryItems.filter(
        (i) => i.dayNumber !== activeDayNum
      );

      reorderMutation.mutate({
        tripId: trip.tripId,
        items: reorderedApi.map((i) => ({
          itemId: i.itemId,
          dayNumber: activeDayNum,
          orderIndex: i.orderIndex,
        })),
        movedItemId: moved.itemId,
        targetDayNumber: activeDayNum,
        prevItemId: prevItem?.itemId ?? null,
        nextItemId: nextItem?.itemId ?? null,
        orderIndex: newIndex + 1,
        optimisticItems: [...otherDays, ...reorderedApi],
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsOverDropzone(false);
  };

  const handleSelectItem = (act: ItineraryItem) => {
    const placeIdStr = act.rawItem
      ? String(act.rawItem.place.placeId)
      : String(act.id);
    setSelectedPlaceId(placeIdStr);
    onSelectActivity?.(act);
  };

  const handleAddLoc = (loc: LocationSuggestion) => {
    if (onAddLocation) {
      onAddLocation(loc);
      return;
    }
    const numericPlaceId = Number(loc.id);
    if (!Number.isNaN(numericPlaceId) && numericPlaceId > 0) {
      const snapshot: ExplorePlace = {
        placeId: numericPlaceId,
        name: loc.name,
        category: 'attraction',
        address: loc.address || '',
        photoUrl: getPlaceFallbackImage('attraction'),
        rating: null,
        reviewCount: 0,
      };
      addItemMutation.mutate({
        tripId: trip.tripId,
        placeId: numericPlaceId,
        dayNumber: activeDayNum,
        placeSnapshot: snapshot,
      });
    }
  };

  const handleUpdateItem = (
    itemId: string | number,
    updatedData: { timeRange?: string; note?: string }
  ) => {
    onUpdateActivity?.(itemId, updatedData);
    const numericItemId = Number(itemId);
    if (!Number.isNaN(numericItemId) && numericItemId > 0) {
      const existing = itineraryItems.find((i) => i.itemId === numericItemId);
      updateItemMutation.mutate({
        tripId: trip.tripId,
        itemId: numericItemId,
        startTime: existing?.startTime ?? null,
        endTime: existing?.endTime ?? null,
        note:
          updatedData.note !== undefined
            ? updatedData.note
            : existing?.note ?? '',
      });
    }
  };

  const handleDeleteItem = (itemId: string | number) => {
    onDeleteActivity?.(itemId);
    const numericItemId = Number(itemId);
    if (!Number.isNaN(numericItemId) && numericItemId > 0) {
      deleteItemMutation.mutate({
        tripId: trip.tripId,
        itemId: numericItemId,
      });
    }
  };

  const handleOptimize = () => {
    if (onOptimizeRoute) {
      onOptimizeRoute();
      return;
    }
    if (dayApiItems.length >= 2) {
      optimizeRouteMutation.mutate({
        tripId: trip.tripId,
        dayNumber: activeDayNum,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 pb-8">
      {/* Bộ chọn ngày của chuyến đi */}
      {daysList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {daysList.map((d) => {
            const isSelected = d.dayNum === activeDayNum;
            return (
              <button
                key={d.dayNum}
                type="button"
                onClick={() => {
                  setSelectedDayNumber(d.dayNum);
                  setSelectedPlaceId(null);
                  setHoveredPlaceId(null);
                }}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ngày {d.dayNum} ({d.dateLabel})
              </button>
            );
          })}
        </div>
      )}

      {/* 1. Header Ngày */}
      <ItineraryDayHeader
        currentDate={currentDate || activeDay.dateLabel}
        totalPlaces={displayedActivities.length}
        isFilteredByMap={isFiltered}
        onToggleMapFilter={
          onToggleMapFilter ?? (() => setLocalFilteredByMap((prev) => !prev))
        }
        onOptimizeRoute={handleOptimize}
      />

      {/* 2. Danh sách hoạt động tích hợp kéo thả @dnd-kit */}
      {isLoading && !externalActivities ? (
        <div className="space-y-3">
          {[1, 2].map((skeleton) => (
            <div
              key={skeleton}
              className="h-24 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <DroppableItineraryZone
            activities={displayedActivities}
            isDraggingActive={Boolean(activeId) && isOverDropzone}
            selectedPlaceId={externalSelectedPlaceId ?? storeSelectedPlaceId}
            onSelectActivity={handleSelectItem}
            onHoverPlace={setHoveredPlaceId}
            onUpdateActivity={handleUpdateItem}
            onDeleteActivity={handleDeleteItem}
            onOpenUpdateModal={onOpenUpdateModal}
          />

          <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
            {activeItem ? (
              <div className="rotate-2 scale-[1.02] shadow-2xl rounded-[20px] ring-2 ring-teal-500/30 cursor-grabbing">
                <TripActivityCard
                  index={activeIndex + 1}
                  title={activeItem.title}
                  timeRange={activeItem.timeRange}
                  tags={activeItem.category}
                  note={activeItem.note}
                  imageUrl={activeItem.imageUrl}
                  isSelected={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* 3. Thanh thêm địa điểm nhanh */}
      <div className="mt-2">
        <AddLocationBar onSelectLocation={handleAddLoc} />
      </div>
    </div>
  );
};