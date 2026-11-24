'use client';

import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, Star, Trash2 } from 'lucide-react';
import type { ItineraryItemResponse } from '@/services/itinerary.service';
import {
  CATEGORY_LABEL_MAP,
  formatRatingLabel,
  getPlaceFallbackImage,
} from '@/services/explore.service';
import { itemDndId } from '@/utils/itineraryDnd';

interface SortableItineraryCardProps {
  item: ItineraryItemResponse;
  index: number; // bắt đầu từ 0
  color: string; // màu của ngày
  isSelected: boolean;
  onSelect: (placeId: number) => void;
  onHover: (placeId: number | null) => void;
  onDelete: (itemId: number, placeId: number) => void;
}

export default function SortableItineraryCard({
  item,
  index,
  color,
  isSelected,
  onSelect,
  onHover,
  onDelete,
}: SortableItineraryCardProps) {
  const { place } = item;
  const fallbackImg = getPlaceFallbackImage(place.category);
  const hasRating =
    place.rating !== null &&
    place.rating !== undefined &&
    !Number.isNaN(Number(place.rating));

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemDndId(item.itemId) });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // id để cuộn tới thẻ khi click marker trên bản đồ
      id={`itinerary-card-${place.placeId}`}
      className={`flex items-start gap-1.5 ${isDragging ? 'opacity-90' : ''}`}
    >
      {/* Tay nắm: chỉ vùng này kích hoạt kéo */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Kéo để đổi thứ tự"
        className="mt-4 shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-400 hover:text-zinc-700 active:cursor-grabbing dark:hover:text-zinc-200"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        onClick={() => onSelect(place.placeId)}
        onMouseEnter={() => onHover(place.placeId)}
        onMouseLeave={() => onHover(null)}
        className={`group relative flex min-w-0 flex-1 items-start gap-3.5 rounded-2xl border p-3.5 transition-all cursor-pointer ${
          isSelected
            ? 'border-teal-600 bg-teal-50/40 shadow-sm dark:bg-teal-950/20'
            : 'border-zinc-200 bg-white hover:border-teal-400 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900'
        }`}
      >
        {/* Số thứ tự: cùng màu với marker trên bản đồ */}
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white shadow-xs"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>

        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <img
            src={place.photoUrl || fallbackImg}
            alt={place.name}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== fallbackImg) e.currentTarget.src = fallbackImg;
            }}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              {place.name}
            </h4>
            <button
              type="button"
              title="Xóa địa điểm khỏi ngày này"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.itemId, place.placeId);
              }}
              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-700">
              {CATEGORY_LABEL_MAP[place.category] || place.subcategory || 'Điểm tham quan'}
            </span>
            {hasRating ? (
              <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {formatRatingLabel(place.rating)}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-zinc-400">Chưa có đánh giá</span>
            )}
          </div>

          {place.address && (
            <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] text-zinc-500">
              <MapPin className="h-3 w-3 shrink-0 text-teal-600" />
              <span className="truncate">{place.address}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
