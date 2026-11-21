'use client';

import React, { useState } from 'react';
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
}

export interface ItineraryTabProps {
  currentDate?: string;
  activities: ItineraryItem[];
  selectedPlaceId?: string | number;
  onSelectActivity: (act: any) => void;
  onAddLocation: (loc: LocationSuggestion) => void;
  onReorderActivities?: (newActivities: ItineraryItem[]) => void;
  onUpdateActivity?: (id: string | number, updatedData: { timeRange?: string; note?: string }) => void;
  onDeleteActivity?: (id: string | number) => void;
  onOpenUpdateModal?: (act: any) => void;
  isFilteredByMap?: boolean;
  onToggleMapFilter?: () => void;
  onOptimizeRoute?: () => void;
}

interface SortableActivityRowProps {
  act: ItineraryItem;
  idx: number;
  selectedPlaceId?: string | number;
  onSelectActivity: (act: any) => void;
  onUpdateActivity?: (id: string | number, updatedData: { timeRange?: string; note?: string }) => void;
  onDeleteActivity?: (id: string | number) => void;
  onOpenUpdateModal?: (act: any) => void;
}

const SortableActivityRow: React.FC<SortableActivityRowProps> = ({
  act,
  idx,
  selectedPlaceId,
  onSelectActivity,
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

  return (
    <div ref={setNodeRef} style={style}>
      <TripActivityCard
        index={idx + 1}
        title={act.title}
        timeRange={act.timeRange}
        tags={act.category}
        note={act.note}
        imageUrl={act.imageUrl}
        isSelected={selectedPlaceId === act.id}
        onClick={() => onSelectActivity(act)}
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
  selectedPlaceId?: string | number;
  onSelectActivity: (act: any) => void;
  onUpdateActivity?: (id: string | number, updatedData: { timeRange?: string; note?: string }) => void;
  onDeleteActivity?: (id: string | number) => void;
  onOpenUpdateModal?: (act: any) => void;
}

const DroppableItineraryZone: React.FC<DroppableItineraryZoneProps> = ({
  activities,
  isDraggingActive,
  selectedPlaceId,
  onSelectActivity,
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
            <p className="text-xs font-medium text-slate-500">Chưa có hoạt động nào trong ngày này.</p>
          </div>
        ) : (
          activities.map((act, idx) => (
            <SortableActivityRow
              key={act.id}
              act={act}
              idx={idx}
              selectedPlaceId={selectedPlaceId}
              onSelectActivity={onSelectActivity}
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
  currentDate = '7/11',
  activities,
  selectedPlaceId,
  onSelectActivity,
  onAddLocation,
  onReorderActivities,
  onUpdateActivity,
  onDeleteActivity,
  onOpenUpdateModal,
  isFilteredByMap,
  onToggleMapFilter,
  onOptimizeRoute,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOverDropzone, setIsOverDropzone] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeIndex = activeId
    ? activities.findIndex((item) => String(item.id) === activeId)
    : -1;
  const activeItem = activeIndex >= 0 ? activities[activeIndex] : null;

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

    const oldIndex = activities.findIndex((item) => String(item.id) === String(active.id));
    const newIndex = activities.findIndex((item) => String(item.id) === String(over.id));

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(activities, oldIndex, newIndex);
      onReorderActivities?.(reordered);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsOverDropzone(false);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200 pb-8">
      {/* 1. Header Ngày */}
      <ItineraryDayHeader
        currentDate={currentDate}
        totalPlaces={activities.length}
        isFilteredByMap={isFilteredByMap}
        onToggleMapFilter={onToggleMapFilter}
        onOptimizeRoute={onOptimizeRoute}
      />

      {/* 2. Danh sách hoạt động tích hợp kéo thả @dnd-kit */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <DroppableItineraryZone
          activities={activities}
          isDraggingActive={Boolean(activeId) && isOverDropzone}
          selectedPlaceId={selectedPlaceId}
          onSelectActivity={onSelectActivity}
          onUpdateActivity={onUpdateActivity}
          onDeleteActivity={onDeleteActivity}
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

      {/* 3. Thanh thêm địa điểm nhanh */}
      <div className="mt-2">
        <AddLocationBar onSelectLocation={onAddLocation} />
      </div>
    </div>
  );
};