'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Check,
  Compass,
  Plus,
  Route,
  Search,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import type { TripResponse } from '@/types/trip';
import type { Place as MapPlace } from '@/types/place';
import type { Place as ExplorePlace } from '@/types/explore';
import TripMapLoader from '@/components/map/TripMapLoader';
import { useTripUiStore } from '@/store/useTripUiStore';
import { useMapStore } from '@/store/useMapStore';
import { useMapHoverStore } from '@/store/useMapHoverStore';
import {
  useAddItineraryItemMutation,
  useDeleteItineraryItemMutation,
  useItineraryQuery,
  useUpdateItineraryItemMutation,
} from '@/hooks/useItinerary';
import { useMoveItineraryItemsMutation } from '@/hooks/useMoveItineraryItems';
import { usePlaces } from '@/hooks/usePlaces';
import DayChip from './DayChip';
import SortableItineraryCard from './SortableItineraryCard';
import { getDayColor } from '@/utils/dayColors';
import { countRoutablePoints, optimizeDayOrder } from '@/utils/routeOptimize';
import {
  dayDndId,
  getDayList,
  itemDndId,
  parseDayDndId,
  parseItemDndId,
  planDayReorder,
  planMove,
} from '@/utils/itineraryDnd';
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

// Thả lên chip ngày thì ưu tiên chip; còn lại chỉ so với các thẻ (bỏ chip khỏi closestCenter)
const collisionDetection: CollisionDetection = (args) => {
  const chipHit = pointerWithin(args).find((c) => parseDayDndId(c.id) !== null);
  if (chipHit) return [chipHit];
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (c) => parseDayDndId(c.id) === null
    ),
  });
};

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
  const moveMutation = useMoveItineraryItemsMutation(trip.tripId);

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

  const dayColor = getDayColor(activeDayNum);
  const canOptimize = countRoutablePoints(dayItems) >= 3;

  // Click marker trên bản đồ -> cuộn tới thẻ tương ứng
  useEffect(() => {
    if (selectedPlaceId == null) return;
    document
      .getElementById(`itinerary-card-${selectedPlaceId}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedPlaceId]);

  // Dữ liệu cho TripMapLoader: order = số trên thẻ (tính trước khi lọc điểm thiếu tọa độ)
  const mapPlaces = useMemo<MapPlace[]>(
    () =>
      dayItems.flatMap((item, idx) => {
        const { latitude, longitude, placeId, name, category } = item.place;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') return [];
        return [
          { id: String(placeId), name, lat: latitude, lng: longitude, category, order: idx + 1 },
        ];
      }),
    [dayItems]
  );

  // Thả thẻ: cùng ngày -> đổi thứ tự; thả lên chip ngày khác -> chuyển sang cuối ngày đó
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = parseItemDndId(active.id);
    if (activeItemId === null) return;
    const moved = itineraryItems.find((i) => i.itemId === activeItemId);
    if (!moved) return;

    let targetDay: number;
    let finalIndex: number;

    const overDay = parseDayDndId(over.id);
    if (overDay !== null) {
      if (overDay === moved.dayNumber) return;
      targetDay = overDay;
      finalIndex = Number.POSITIVE_INFINITY; // cuối ngày đích
    } else {
      const overItemId = parseItemDndId(over.id);
      const overItem =
        overItemId === null ? undefined : itineraryItems.find((i) => i.itemId === overItemId);
      if (!overItem || overItem.dayNumber === null) return;
      targetDay = overItem.dayNumber;
      finalIndex = getDayList(itineraryItems, targetDay).findIndex(
        (i) => i.itemId === overItem.itemId
      );
    }

    const plan = planMove(itineraryItems, activeItemId, targetDay, finalIndex);
    if (plan) moveMutation.mutate([plan]);
  };

  // Tối ưu lộ trình: giữ điểm đầu, các điểm sau xếp theo khoảng cách gần nhất
  const handleOptimizeRoute = () => {
    const orderedIds = optimizeDayOrder(dayItems);
    const plans = planDayReorder(itineraryItems, activeDayNum, orderedIds);
    if (plans.length > 0) moveMutation.mutate(plans);
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
      <div className="w-full md:w-[480px] lg:w-[520px] shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col overflow-y-auto">
        <DndContext
          id="itinerary-dnd" // id cố định để tránh lỗi hydration của dnd-kit
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragEnd={handleDragEnd}
        >
          {/* Chip chọn ngày (cũng là vùng thả để chuyển địa điểm sang ngày khác) */}
          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {daysList.map((d) => (
                <DayChip
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
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  Lộ trình Ngày {activeDayNum}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {activeDay.dateLabel} • {dayItems.length} địa điểm đã lên lịch
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOptimizeRoute}
                  disabled={!canOptimize || moveMutation.isPending}
                  title="Giữ nguyên điểm đầu, sắp các điểm còn lại theo khoảng cách gần nhất"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Tối ưu lộ trình</span>
                </button>

                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-600/30 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-teal-600" />
                  <span>Khám phá thêm</span>
                </Link>
              </div>
            </div>

            {/* 1. Danh sách địa điểm trong ngày đang chọn (kéo thả để đổi thứ tự) */}
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
                items={dayItems.map((i) => itemDndId(i.itemId))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {dayItems.map((item, idx) => (
                    <SortableItineraryCard
                      key={item.itemId}
                      item={item}
                      index={idx}
                      color={dayColor}
                      isSelected={
                        selectedPlaceId !== null &&
                        String(selectedPlaceId) === String(item.place.placeId)
                      }
                      onSelect={(placeId) => setSelectedPlaceId(String(placeId))}
                      onHover={(placeId) =>
                        setHoveredPlaceId(placeId === null ? null : String(placeId))
                      }
                      onDelete={handleDeleteItineraryItem}
                    />
                  ))}
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
        </DndContext>
      </div>

      {/* Cột phải: Bản đồ tương tác (tự động vẽ marker & đường nối theo dayItems của ngày đang chọn) */}
      <div className="hidden md:block flex-1 h-full relative bg-zinc-100 dark:bg-zinc-950">
        <TripMapLoader
          places={mapPlaces}
          dayKey={`day-${activeDayNum}`}
          dayColor={dayColor}
        />
      </div>
    </div>
  );
}