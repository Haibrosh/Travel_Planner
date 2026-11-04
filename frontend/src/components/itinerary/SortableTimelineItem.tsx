'use client';

import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TripActivityCard } from '@/components/cards/TripActivityCard';
import { TripActivityPopupMenu } from '@/components/cards/TripActivityPopupMenu';
import type { ItineraryItem } from '@/types/itinerary';
import { getTimeRange } from '@/utils/schedule';

interface SortableTimelineItemProps {
  item: ItineraryItem;
  index: number; // bắt đầu từ 0
  isSelected: boolean;
  isMenuOpen: boolean;
  onSelect: (placeId: string) => void;
  onToggleMenu: (placeId: string) => void;
  onCloseMenu: () => void;
  onRemove: (placeId: string) => void;
}

export default function SortableTimelineItem({
  item,
  index,
  isSelected,
  isMenuOpen,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onRemove,
}: SortableTimelineItemProps) {
  const { place, tags, note, imageUrl } = item;

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: place.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  // Nút ⋯ + popup menu, gắn vào thẻ qua menuSlot
  const menu = (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Tùy chọn"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        // Chặn mousedown để popup không tự đóng rồi mở lại khi bấm lần nữa vào ⋯
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => onToggleMenu(place.id)}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-base leading-none text-slate-500 hover:bg-slate-100"
      >
        ⋯
      </button>
      {isMenuOpen && (
        // TODO: onAddTime / onAddNote làm sau (hiện bấm chỉ đóng menu)
        <TripActivityPopupMenu onDelete={() => onRemove(place.id)} onClose={onCloseMenu} />
      )}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`itinerary-card-${place.id}`}
      className={`flex items-start gap-1.5 ${isDragging ? 'opacity-90' : ''}`}
    >
      {/* Tay nắm nằm ngoài thẻ (theo Figma): chỉ vùng này kích hoạt kéo */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Kéo để đổi thứ tự"
        className="mt-4 shrink-0 cursor-grab touch-none rounded p-0.5 text-slate-400 hover:text-slate-700 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <TripActivityCard
          index={index + 1}
          title={place.name}
          timeRange={getTimeRange(index)}
          tags={tags}
          note={note}
          imageUrl={imageUrl}
          isSelected={isSelected}
          onClick={() => onSelect(place.id)}
          menuSlot={menu}
        />
      </div>
    </div>
  );
}