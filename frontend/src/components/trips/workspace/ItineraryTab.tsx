'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  DndContext,
  type DragEndEvent,
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
import {
  MapPin,
  Plus,
  Trash2,
  Star,
  Search,
  Sparkles,
  Check,
  Compass,
  GripVertical,
  Clock,
  StickyNote,
  Pencil,
  X,
  Route,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import type { TripResponse } from '@/types/trip';
import type { Place as MapPlace } from '@/types/place';
import type { Place as ExplorePlace } from '@/types/explore';
import type { ItineraryItemResponse } from '@/services/itinerary.service';
import TripMapLoader from '@/components/map/TripMapLoader';
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
import { usePlaces } from '@/hooks/usePlaces';
import {
  CATEGORY_LABEL_MAP,
  formatRatingLabel,
  getPlaceFallbackImage,
} from '@/services/explore.service';

interface ItineraryTabProps {
  trip: TripResponse;
}

const POOL_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'attraction', label: 'Điểm tham quan' },
  { id: 'restaurant', label: 'Nhà hàng' },
  { id: 'cafe', label: 'Quán cà phê' },
  { id: 'hotel', label: 'Khách sạn' },
] as const;

interface DroppableDayChipProps {
  dayNum: number;
  dateLabel: string;
  count: number;
  isSelected: boolean;
  onSelect: () => void;
}

function DroppableDayChip({
  dayNum,
  dateLabel,
  count,
  isSelected,
  onSelect,
}: DroppableDayChipProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day-drop-${dayNum}`,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer tabular-nums ${
        isOver
          ? 'ring-2 ring-teal-500 bg-teal-50 text-teal-900 scale-[1.03]'
          : isSelected
            ? 'bg-[#0F766E] text-white shadow-xs'
            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
      }`}
    >
      <span>
        Ngày {dayNum} ({dateLabel})
      </span>
      {count > 0 && (
        <span
          className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold tabular-nums ${
            isSelected ? 'bg-white text-[#0F766E]' : 'bg-teal-600 text-white'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface SortableItineraryCardProps {
  item: ItineraryItemResponse;
  idx: number;
  activeDayNum: number;
  daysList: { dayNum: number; dateLabel: string; rawDate: string }[];
  isSelected: boolean;
  isSavingUpdate: boolean;
  onSelectPlace: (placeId: string) => void;
  onHoverPlace: (placeId: string | null) => void;
  onDelete: (itemId: number, placeId: number) => void;
  onSaveMeta: (
    itemId: number,
    payload: { startTime: string | null; endTime: string | null; note: string }
  ) => void;
  onMoveToDay: (item: ItineraryItemResponse, targetDayNum: number) => void;
}

function SortableItineraryCard({
  item,
  idx,
  activeDayNum,
  daysList,
  isSelected,
  isSavingUpdate,
  onSelectPlace,
  onHoverPlace,
  onDelete,
  onSaveMeta,
  onMoveToDay,
}: SortableItineraryCardProps) {
  const { place } = item;
  const fallbackImg = getPlaceFallbackImage(place.category);
  const hasRating =
    place.rating !== null &&
    place.rating !== undefined &&
    !Number.isNaN(Number(place.rating));

  const [isEditing, setIsEditing] = useState(false);
  const [draftStart, setDraftStart] = useState(item.startTime ?? '');
  const [draftEnd, setDraftEnd] = useState(item.endTime ?? '');
  const [draftNote, setDraftNote] = useState(item.note ?? '');
  const [timeError, setTimeError] = useState<string | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.itemId });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : undefined,
  };

  const formattedTimeBadge =
    item.startTime && item.endTime
      ? `${item.startTime} – ${item.endTime}`
      : item.startTime
        ? `Từ ${item.startTime}`
        : item.endTime
          ? `Đến ${item.endTime}`
          : null;

  const handleOpenEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftStart(item.startTime ?? '');
    setDraftEnd(item.endTime ?? '');
    setDraftNote(item.note ?? '');
    setTimeError(null);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const cleanStart = draftStart.trim() || null;
    const cleanEnd = draftEnd.trim() || null;

    if (cleanStart && cleanEnd && cleanEnd < cleanStart) {
      setTimeError('Giờ kết thúc phải lớn hơn hoặc bằng giờ bắt đầu');
      return;
    }

    setTimeError(null);
    onSaveMeta(item.itemId, {
      startTime: cleanStart,
      endTime: cleanEnd,
      note: draftNote.trim(),
    });
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`workspace-itinerary-card-${place.placeId}`}
      onClick={() => onSelectPlace(String(place.placeId))}
      onMouseEnter={() => onHoverPlace(String(place.placeId))}
      onMouseLeave={() => onHoverPlace(null)}
      className={`group relative flex items-start gap-2.5 rounded-2xl border p-3.5 transition-all cursor-pointer ${
        isDragging
          ? 'border-teal-600 bg-white shadow-lg ring-2 ring-teal-500/30 opacity-95'
          : isSelected
            ? 'border-teal-600 bg-teal-50/40 shadow-xs'
            : 'border-zinc-200 bg-white hover:border-teal-400 hover:shadow-2xs dark:border-zinc-800 dark:bg-zinc-900'
      }`}
    >
      {/* Tay nắm kéo thả (@dnd-kit) */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Kéo thả để đổi vị trí địa điểm"
        title="Kéo thả để đổi thứ tự hoặc thả vào chip Ngày phía trên"
        className="mt-1.5 shrink-0 cursor-grab touch-none rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing dark:hover:bg-zinc-800"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Số thứ tự khớp với Marker trên bản đồ */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F766E] text-xs font-extrabold text-white shadow-2xs mt-0.5 tabular-nums">
        {idx + 1}
      </div>

      {/* Ảnh địa điểm */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        <img
          src={place.photoUrl || fallbackImg}
          alt={place.name}
          loading="lazy"
          onError={(e) => {
            if (e.currentTarget.src !== fallbackImg) {
              e.currentTarget.src = fallbackImg;
            }
          }}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Thông tin địa điểm + Giờ tham quan + Ghi chú */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
            {place.name}
          </h4>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Đổi ngày nhanh */}
            {daysList.length > 1 && (
              <div className="relative flex items-center">
                <CalendarDays className="w-3 h-3 text-zinc-400 absolute left-1.5 pointer-events-none" />
                <select
                  aria-label="Chuyển sang ngày khác"
                  title="Chuyển địa điểm sang ngày khác"
                  value={activeDayNum}
                  onChange={(e) => {
                    const targetDay = Number(e.target.value);
                    if (targetDay !== activeDayNum) {
                      onMoveToDay(item, targetDay);
                    }
                  }}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 pl-5 pr-1.5 py-1 text-[10px] font-bold text-zinc-600 hover:border-teal-400 focus:border-teal-600 focus:outline-none cursor-pointer tabular-nums dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {daysList.map((d) => (
                    <option key={d.dayNum} value={d.dayNum}>
                      Ngày {d.dayNum}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nút mở form chỉnh sửa giờ & ghi chú */}
            <button
              type="button"
              title="Chỉnh sửa giờ tham quan & ghi chú"
              onClick={handleOpenEditor}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-zinc-400 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* Nút xóa */}
            <button
              type="button"
              title="Xóa địa điểm khỏi ngày này"
              onClick={() => onDelete(item.itemId, place.placeId)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hàng badge Danh mục, Đánh giá và Giờ tham quan */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
            {CATEGORY_LABEL_MAP[place.category] ||
              place.subcategory ||
              'Điểm tham quan'}
          </span>

          {hasRating ? (
            <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 tabular-nums">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {formatRatingLabel(place.rating)}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-zinc-400">
              Chưa có đánh giá
            </span>
          )}

          {formattedTimeBadge ? (
            <button
              type="button"
              onClick={handleOpenEditor}
              title="Bấm để sửa giờ tham quan"
              className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50/70 px-2 py-0.5 text-[11px] font-bold text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer tabular-nums"
            >
              <Clock className="w-3 h-3 text-teal-600" />
              <span>{formattedTimeBadge}</span>
            </button>
          ) : (
            !isEditing && (
              <button
                type="button"
                onClick={handleOpenEditor}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 hover:border-teal-400 hover:text-teal-700 transition-colors cursor-pointer"
              >
                <Clock className="w-2.5 h-2.5" />
                <span>+ Giờ tham quan</span>
              </button>
            )
          )}
        </div>

        {place.address && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500 truncate">
            <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
            <span className="truncate">{place.address}</span>
          </p>
        )}

        {/* Hiển thị ghi chú hiện tại hoặc nút thêm ghi chú nhanh */}
        {!isEditing && (
          <div className="mt-2">
            {item.note ? (
              <div
                onClick={handleOpenEditor}
                title="Bấm để chỉnh sửa ghi chú"
                className="flex items-start gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50/50 px-2.5 py-1.5 text-[11px] text-zinc-700 hover:border-amber-300 transition-colors"
              >
                <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2 break-words">{item.note}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenEditor}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-teal-700 transition-colors cursor-pointer"
              >
                <StickyNote className="w-3 h-3" />
                <span>+ Thêm ghi chú cho địa điểm này</span>
              </button>
            )}
          </div>
        )}

        {/* Form inline chỉnh sửa Giờ tham quan (startTime, endTime) & Ghi chú (note) */}
        {isEditing && (
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 space-y-2.5 rounded-xl border border-teal-200 bg-teal-50/30 p-3 dark:border-teal-900 dark:bg-zinc-800/70"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  <Clock className="h-3 w-3 text-teal-600" />
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={draftStart}
                  onChange={(e) => {
                    setDraftStart(e.target.value);
                    setTimeError(null);
                  }}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 tabular-nums focus:border-teal-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  <Clock className="h-3 w-3 text-teal-600" />
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  value={draftEnd}
                  onChange={(e) => {
                    setDraftEnd(e.target.value);
                    setTimeError(null);
                  }}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 tabular-nums focus:border-teal-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {timeError && (
              <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{timeError}</span>
              </p>
            )}

            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                <StickyNote className="h-3 w-3 text-teal-600" />
                Ghi chú tham quan
              </label>
              <input
                type="text"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setIsEditing(false);
                  }
                }}
                placeholder="VD: Mua vé online trước, mang áo khoác nhẹ, thử món đặc sản..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setDraftStart('');
                  setDraftEnd('');
                  setTimeError(null);
                }}
                className="text-[11px] font-semibold text-zinc-500 hover:text-rose-600 cursor-pointer"
              >
                Xóa giờ
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <X className="h-3 w-3" />
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingUpdate}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1 text-[11px] font-bold text-white hover:bg-teal-800 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ItineraryTab({ trip }: ItineraryTabProps) {
  const { selectedDayNumber, setSelectedDayNumber } = useTripUiStore();
  const selectedPlaceId = useMapStore((s) => s.selectedPlaceId);
  const setSelectedPlaceId = useMapStore((s) => s.setSelectedPlaceId);
  const setHoveredPlaceId = useMapHoverStore((s) => s.setHoveredPlaceId);

  // State bộ lọc cho Pool địa điểm trong Workspace
  const [poolSearch, setPoolSearch] = useState('');
  const [debouncedPoolSearch, setDebouncedPoolSearch] = useState('');
  const [poolCategory, setPoolCategory] = useState<string>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPoolSearch(poolSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [poolSearch]);

  // Cảm biến kéo thả dnd-kit (yêu cầu dịch chuyển 5px mới kích hoạt để không cản click)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sinh danh sách các ngày trong chuyến đi
  const daysList = useMemo(() => {
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const days: { dayNum: number; dateLabel: string; rawDate: string }[] = [];
      const current = new Date(start);

      let dayNum = 1;
      while (current <= end && dayNum <= 30) {
        const dStr = current.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        });
        days.push({
          dayNum,
          dateLabel: dStr,
          rawDate: current.toISOString().split('T')[0],
        });
        current.setDate(current.getDate() + 1);
        dayNum++;
      }
      return days.length > 0
        ? days
        : [{ dayNum: 1, dateLabel: trip.startDate, rawDate: trip.startDate }];
    } catch {
      return [{ dayNum: 1, dateLabel: trip.startDate, rawDate: trip.startDate }];
    }
  }, [trip.startDate, trip.endDate]);

  // Đảm bảo selectedDayNumber luôn nằm trong phạm vi ngày hợp lệ của chuyến đi
  const activeDay = useMemo(() => {
    return (
      daysList.find((d) => d.dayNum === selectedDayNumber) ??
      daysList[0] ?? { dayNum: 1, dateLabel: trip.startDate, rawDate: trip.startDate }
    );
  }, [daysList, selectedDayNumber, trip.startDate]);

  const activeDayNum = activeDay.dayNum;

  // 1. Gọi React Query lấy danh sách lịch trình của chuyến đi & các mutation Optimistic Update
  const { data: itineraryItems = [], isLoading: isItineraryLoading } = useItineraryQuery(
    trip.tripId
  );
  const addItemMutation = useAddItineraryItemMutation(trip.tripId);
  const deleteItemMutation = useDeleteItineraryItemMutation(trip.tripId);
  const updateItemMutation = useUpdateItineraryItemMutation(trip.tripId);
  const reorderMutation = useReorderItineraryMutation(trip.tripId);
  const optimizeRouteMutation = useOptimizeDayRouteMutation(trip.tripId);

  // 2. Lấy danh sách địa điểm gợi ý từ places_v2 theo tỉnh của chuyến đi cho Pool
  const { data: poolPlacesPage, isLoading: isPoolLoading } = usePlaces({
    destinationId: trip.provinceCode,
    q: debouncedPoolSearch,
    category: poolCategory,
    sort: 'popular',
    page: 1,
    size: 12,
  });

  const poolPlaces = poolPlacesPage?.content ?? [];

  // Tách danh sách theo ngày đang chọn và danh sách chưa xếp ngày (dayNumber === null)
  const dayItems = useMemo(
    () =>
      itineraryItems
        .filter((item) => item.dayNumber === activeDayNum)
        .sort((a, b) => a.positionIndex - b.positionIndex),
    [itineraryItems, activeDayNum]
  );

  const unassignedPoolItems = useMemo(
    () => itineraryItems.filter((item) => item.dayNumber === null),
    [itineraryItems]
  );

  // Đếm số địa điểm của từng ngày để hiển thị trên chip ngày
  const countByDay = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const item of itineraryItems) {
      if (item.dayNumber !== null && item.dayNumber > 0) {
        counts[item.dayNumber] = (counts[item.dayNumber] ?? 0) + 1;
      }
    }
    return counts;
  }, [itineraryItems]);

  // Chuyển đổi dayItems sang định dạng MapPlace cho TripMapLoader
  const mapPlaces = useMemo<MapPlace[]>(() => {
    return dayItems
      .filter(
        (item) =>
          item.place.latitude !== null &&
          item.place.latitude !== undefined &&
          item.place.longitude !== null &&
          item.place.longitude !== undefined
      )
      .map((item) => ({
        id: String(item.place.placeId),
        name: item.place.name,
        lat: Number(item.place.latitude),
        lng: Number(item.place.longitude),
        category: item.place.category,
      }));
  }, [dayItems]);

  // Xử lý chuyển một địa điểm sang ngày khác (bằng kéo thả lên chip Ngày hoặc chọn từ dropdown)
  const handleMoveItemToDay = (movedItem: ItineraryItemResponse, targetDayNum: number) => {
    if (targetDayNum === movedItem.dayNumber) return;

    const sourceDayRemaining = itineraryItems
      .filter((i) => i.dayNumber === movedItem.dayNumber && i.itemId !== movedItem.itemId)
      .sort((a, b) => a.positionIndex - b.positionIndex)
      .map((item, idx) => ({
        ...item,
        orderIndex: idx + 1,
        positionIndex: idx + 1,
      }));

    const targetDayCurrent = itineraryItems
      .filter((i) => i.dayNumber === targetDayNum && i.itemId !== movedItem.itemId)
      .sort((a, b) => a.positionIndex - b.positionIndex);

    const prevItem =
      targetDayCurrent.length > 0 ? targetDayCurrent[targetDayCurrent.length - 1] : null;
    const newOrderIndex = targetDayCurrent.length + 1;

    const updatedMovedItem: ItineraryItemResponse = {
      ...movedItem,
      dayNumber: targetDayNum,
      orderIndex: newOrderIndex,
      positionIndex: newOrderIndex,
    };

    const targetDayUpdated = [...targetDayCurrent, updatedMovedItem].map((item, idx) => ({
      ...item,
      dayNumber: targetDayNum,
      orderIndex: idx + 1,
      positionIndex: idx + 1,
    }));

    const otherDaysItems = itineraryItems.filter(
      (i) => i.dayNumber !== movedItem.dayNumber && i.dayNumber !== targetDayNum
    );

    const optimisticItems: ItineraryItemResponse[] = [
      ...otherDaysItems,
      ...sourceDayRemaining,
      ...targetDayUpdated,
    ];

    const batchEntries = [...sourceDayRemaining, ...targetDayUpdated].map((i) => ({
      itemId: i.itemId,
      dayNumber: i.dayNumber,
      orderIndex: i.orderIndex,
    }));

    reorderMutation.mutate({
      tripId: trip.tripId,
      items: batchEntries,
      movedItemId: movedItem.itemId,
      targetDayNumber: targetDayNum,
      prevItemId: prevItem?.itemId ?? null,
      nextItemId: null,
      orderIndex: newOrderIndex,
      optimisticItems,
    });
  };

  // Xử lý kéo thả đổi vị trí địa điểm (Optimistic Update: 0ms không nháy, lỗi mới rollback)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = Number(active.id);
    const movedItem = dayItems.find((i) => i.itemId === activeItemId);
    if (!movedItem) return;

    // Trường hợp 1: Kéo thả thẻ địa điểm vào một chip Ngày khác ("day-drop-X")
    const overIdStr = String(over.id);
    if (overIdStr.startsWith('day-drop-')) {
      const targetDayNum = Number(overIdStr.replace('day-drop-', ''));
      if (!Number.isNaN(targetDayNum) && targetDayNum !== activeDayNum) {
        handleMoveItemToDay(movedItem, targetDayNum);
      }
      return;
    }

    // Trường hợp 2: Kéo thả đổi thứ tự trong cùng ngày đang chọn
    const overItemId = Number(over.id);
    if (activeItemId === overItemId) return;

    const oldIndex = dayItems.findIndex((i) => i.itemId === activeItemId);
    const newIndex = dayItems.findIndex((i) => i.itemId === overItemId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const reorderedDayItems = arrayMove(dayItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      orderIndex: idx + 1,
      positionIndex: idx + 1,
    }));

    const prevItem = newIndex > 0 ? reorderedDayItems[newIndex - 1] : null;
    const nextItem =
      newIndex < reorderedDayItems.length - 1 ? reorderedDayItems[newIndex + 1] : null;

    const otherDaysItems = itineraryItems.filter((i) => i.dayNumber !== activeDayNum);
    const optimisticItems: ItineraryItemResponse[] = [...otherDaysItems, ...reorderedDayItems];

    reorderMutation.mutate({
      tripId: trip.tripId,
      items: reorderedDayItems.map((i) => ({
        itemId: i.itemId,
        dayNumber: activeDayNum,
        orderIndex: i.orderIndex,
      })),
      movedItemId: movedItem.itemId,
      targetDayNumber: activeDayNum,
      prevItemId: prevItem?.itemId ?? null,
      nextItemId: nextItem?.itemId ?? null,
      orderIndex: newIndex + 1,
      optimisticItems,
    });
  };

  // Xử lý lưu chỉnh sửa giờ tham quan (startTime, endTime) và ghi chú (note)
  const handleSaveCardMeta = (
    itemId: number,
    payload: { startTime: string | null; endTime: string | null; note: string }
  ) => {
    updateItemMutation.mutate({
      tripId: trip.tripId,
      itemId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      note: payload.note,
    });
  };

  // Xử lý bấm nút + trong Pool địa điểm để lưu vào ngày đang chọn
  const handleAddPlaceToSelectedDay = (place: ExplorePlace) => {
    addItemMutation.mutate({
      tripId: trip.tripId,
      placeId: place.placeId,
      dayNumber: activeDayNum,
      placeSnapshot: place,
    });
  };

  // Xử lý chuyển địa điểm từ Pool (chưa xếp ngày) vào ngày đang chọn
  const handleAssignFromPoolToSelectedDay = (itemId: number) => {
    updateItemMutation.mutate({
      tripId: trip.tripId,
      itemId,
      dayNumber: activeDayNum,
      positionIndex: dayItems.length + 1,
    });
  };

  // Xử lý xóa địa điểm khỏi lịch trình
  const handleDeleteItineraryItem = (itemId: number, placeId: number) => {
    if (String(selectedPlaceId) === String(placeId)) {
      setSelectedPlaceId(null);
    }
    deleteItemMutation.mutate({
      tripId: trip.tripId,
      itemId,
    });
  };

  return (
    <div className="flex h-[calc(100vh-125px)] w-full overflow-hidden">
      {/* Cột trái: Timeline lịch trình các ngày & Pool địa điểm */}
      <DndContext
        id="workspace-itinerary-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full md:w-[480px] lg:w-[540px] shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col overflow-y-auto">
          {/* Day Selector Chips (Lưu trạng thái vào useTripUiStore.selectedDayNumber + nhận kéo thả đổi ngày) */}
          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {daysList.map((d) => (
                <DroppableDayChip
                  key={d.dayNum}
                  dayNum={d.dayNum}
                  dateLabel={d.dateLabel}
                  count={countByDay[d.dayNum] ?? 0}
                  isSelected={activeDayNum === d.dayNum}
                  onSelect={() => {
                    setSelectedDayNumber(d.dayNum);
                    setSelectedPlaceId(null);
                    setHoveredPlaceId(null);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Nội dung ngày được chọn */}
          <div className="flex-1 p-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  Lộ trình Ngày {activeDayNum}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                  {activeDay.dateLabel} • {dayItems.length} địa điểm đã lên lịch
                </p>
              </div>

              <div className="flex items-center gap-2">
                {dayItems.length >= 2 && (
                  <button
                    type="button"
                    disabled={optimizeRouteMutation.isPending}
                    onClick={() =>
                      optimizeRouteMutation.mutate({
                        tripId: trip.tripId,
                        dayNumber: activeDayNum,
                      })
                    }
                    title="Tối ưu thứ tự di chuyển ngắn nhất bằng thuật toán 2-Opt"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-teal-500 hover:text-teal-700 transition-colors cursor-pointer disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <Route className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {optimizeRouteMutation.isPending ? 'Đang tối ưu...' : 'Tối ưu lộ trình'}
                    </span>
                  </button>
                )}

                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-600/30 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-teal-600" />
                  <span>Khám phá thêm</span>
                </Link>
              </div>
            </div>

            {/* 1. Danh sách các địa điểm trong ngày đang chọn (Sortable + Optimistic Reorder + Inline Note/Time Edit) */}
            {isItineraryLoading ? (
              <div className="space-y-3">
                {[1, 2].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="h-24 rounded-2xl border border-zinc-200 bg-zinc-50 animate-pulse"
                  />
                ))}
              </div>
            ) : dayItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-7 text-center dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-lg text-teal-600 mb-2">
                  📍
                </div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Chưa có địa điểm nào trong Ngày {activeDayNum}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Bấm nút <span className="font-bold text-teal-600">+</span> ở danh sách Pool địa điểm bên dưới hoặc từ trang Khám phá để thêm vào Ngày {activeDayNum}.
                </p>
              </div>
            ) : (
              <SortableContext
                items={dayItems.map((item) => item.itemId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {dayItems.map((item, idx) => {
                    const isSelected =
                      selectedPlaceId !== null &&
                      String(selectedPlaceId) === String(item.place.placeId);

                    return (
                      <SortableItineraryCard
                        key={item.itemId}
                        item={item}
                        idx={idx}
                        activeDayNum={activeDayNum}
                        daysList={daysList}
                        isSelected={isSelected}
                        isSavingUpdate={updateItemMutation.isPending}
                        onSelectPlace={setSelectedPlaceId}
                        onHoverPlace={setHoveredPlaceId}
                        onDelete={handleDeleteItineraryItem}
                        onSaveMeta={handleSaveCardMeta}
                        onMoveToDay={handleMoveItemToDay}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            )}

            {/* 2. Hàng chờ chưa xếp ngày (Unassigned Pool items nếu có) */}
            {unassignedPoolItems.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider tabular-nums">
                    Hàng chờ chưa xếp ngày ({unassignedPoolItems.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {unassignedPoolItems.map((item) => {
                    const { place } = item;
                    const fallbackImg = getPlaceFallbackImage(place.category);
                    return (
                      <div
                        key={item.itemId}
                        className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-2.5"
                      >
                        <img
                          src={place.photoUrl || fallbackImg}
                          alt={place.name}
                          onError={(e) => {
                            if (e.currentTarget.src !== fallbackImg) {
                              e.currentTarget.src = fallbackImg;
                            }
                          }}
                          className="h-11 w-11 shrink-0 rounded-lg object-cover bg-zinc-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {place.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {CATEGORY_LABEL_MAP[place.category] || 'Khám phá'} •{' '}
                            {place.rating !== null
                              ? `⭐ ${formatRatingLabel(place.rating)}`
                              : 'Chưa có đánh giá'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAssignFromPoolToSelectedDay(item.itemId)}
                          title={`Chuyển vào Ngày ${activeDayNum}`}
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ngày {activeDayNum}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteItineraryItem(item.itemId, place.placeId)
                          }
                          title="Xóa khỏi Pool"
                          className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Pool Địa điểm gợi ý từ places_v2 (Bấm nút + để lưu vào Ngày đang chọn) */}
            <div className="space-y-3.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Pool địa điểm gợi ý ({trip.destinationName || `Mã tỉnh #${trip.provinceCode}`})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-teal-700">
                  Bấm + để thêm vào Ngày {activeDayNum}
                </span>
              </div>

              {/* Ô tìm kiếm nhanh trong Pool */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                  placeholder="Tìm địa điểm tham quan, nhà hàng, cà phê, khách sạn..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Bộ lọc 4 mã category của places_v2 */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {POOL_CATEGORIES.map((cat) => {
                  const isActive = poolCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPoolCategory(cat.id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Danh sách thẻ địa điểm trong Pool */}
              {isPoolLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className="h-16 rounded-xl border border-zinc-200 bg-zinc-50 animate-pulse"
                    />
                  ))}
                </div>
              ) : poolPlaces.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-400">
                  Không tìm thấy địa điểm phù hợp trong khu vực này.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {poolPlaces.map((place) => {
                    const fallbackImg = getPlaceFallbackImage(place.category);
                    const alreadyInActiveDay = dayItems.some(
                      (i) => Number(i.place.placeId) === Number(place.placeId)
                    );
                    const hasRating =
                      place.rating !== null &&
                      place.rating !== undefined &&
                      !Number.isNaN(Number(place.rating));

                    return (
                      <div
                        key={place.placeId}
                        className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2.5 hover:border-teal-300 transition-all dark:border-zinc-800 dark:bg-zinc-800/60"
                      >
                        <img
                          src={place.photoUrl || fallbackImg}
                          alt={place.name}
                          loading="lazy"
                          onError={(e) => {
                            if (e.currentTarget.src !== fallbackImg) {
                              e.currentTarget.src = fallbackImg;
                            }
                          }}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover bg-zinc-100"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {place.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                            <span className="font-semibold text-teal-700">
                              {CATEGORY_LABEL_MAP[place.category] ||
                                place.subcategory ||
                                'Khám phá'}
                            </span>
                            <span>•</span>
                            {hasRating ? (
                              <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 tabular-nums">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {formatRatingLabel(place.rating)}
                              </span>
                            ) : (
                              <span className="text-zinc-400">Chưa có đánh giá</span>
                            )}
                          </div>
                        </div>

                        {alreadyInActiveDay ? (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã thêm</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={addItemMutation.isPending}
                            onClick={() => handleAddPlaceToSelectedDay(place)}
                            title={`Thêm "${place.name}" vào Ngày ${activeDayNum}`}
                            className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Ngày {activeDayNum}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DndContext>

      {/* Cột phải: Bản đồ tương tác (tự động vẽ marker & đường nối theo dayItems của ngày đang chọn) */}
      <div className="hidden md:block flex-1 h-full relative bg-zinc-100 dark:bg-zinc-950">
        <TripMapLoader places={mapPlaces} />
      </div>
    </div>
  );
}
