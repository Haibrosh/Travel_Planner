'use client';

import React from 'react';
import { ItineraryDayHeader } from './ItineraryDayHeader';
import { TripActivityCard } from '@/components/cards/TripActivityCard';
import { AddLocationBar, LocationSuggestion } from './AddLocationBar';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(activities);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderActivities?.(items);
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

      {/* 2. Danh sách hoạt động tích hợp kéo thả nâng cao */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="itinerary-drop-zone">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`flex flex-col gap-3 p-2 rounded-2xl transition-colors duration-200 ${
                snapshot.isDraggingOver ? 'bg-teal-50/40 border-2 border-dashed border-teal-300/60' : 'border-2 border-transparent'
              }`}
            >
              {activities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                  <p className="text-xs font-medium text-slate-500">Chưa có hoạt động nào trong ngày này.</p>
                </div>
              ) : (
                activities.map((act, idx) => (
                  <Draggable key={act.id} draggableId={String(act.id)} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                        className={`transition-shadow duration-200 ${
                          snapshot.isDragging ? 'opacity-95 shadow-2xl rotate-1 scale-102 z-50' : 'opacity-100'
                        }`}
                      >
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
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 3. Thanh thêm địa điểm nhanh */}
      <div className="mt-2">
        <AddLocationBar onSelectLocation={onAddLocation} />
      </div>
    </div>
  );
};