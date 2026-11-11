'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Trash2,
  Star,
  Search,
  Sparkles,
  Check,
  Compass,
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

  // 1. Gọi React Query lấy danh sách lịch trình của chuyến đi
  const { data: itineraryItems = [], isLoading: isItineraryLoading } = useItineraryQuery(
    trip.tripId
  );
  const addItemMutation = useAddItineraryItemMutation(trip.tripId);
  const deleteItemMutation = useDeleteItineraryItemMutation(trip.tripId);
  const updateItemMutation = useUpdateItineraryItemMutation(trip.tripId);

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
        {/* Day Selector Chips (Lưu trạng thái vào useTripUiStore.selectedDayNumber) */}
        <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {daysList.map((d) => {
              const isSelected = activeDayNum === d.dayNum;
              const count = countByDay[d.dayNum] ?? 0;
              return (
                <button
                  key={d.dayNum}
                  type="button"
                  onClick={() => {
                    setSelectedDayNumber(d.dayNum);
                    setSelectedPlaceId(null);
                    setHoveredPlaceId(null);
                  }}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span>
                    Ngày {d.dayNum} ({d.dateLabel})
                  </span>
                  {count > 0 && (
                    <span
                      className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-white text-[#0F766E]'
                          : 'bg-teal-600 text-white'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
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

            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-600/30 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Khám phá thêm</span>
            </Link>
          </div>

          {/* 1. Danh sách các địa điểm trong ngày đang chọn */}
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
            <div className="space-y-3">
              {dayItems.map((item, idx) => {
                const { place } = item;
                const fallbackImg = getPlaceFallbackImage(place.category);
                const isSelected =
                  selectedPlaceId !== null &&
                  String(selectedPlaceId) === String(place.placeId);
                const hasRating =
                  place.rating !== null &&
                  place.rating !== undefined &&
                  !Number.isNaN(Number(place.rating));

                return (
                  <div
                    key={item.itemId}
                    onClick={() => setSelectedPlaceId(String(place.placeId))}
                    onMouseEnter={() => setHoveredPlaceId(String(place.placeId))}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                    className={`group relative flex items-start gap-3.5 rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/40 shadow-sm'
                        : 'border-zinc-200 bg-white hover:border-teal-400 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    {/* Số thứ tự khớp với Marker trên bản đồ */}
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0F766E] text-xs font-extrabold text-white shadow-xs mt-0.5">
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

                    {/* Thông tin địa điểm */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                          {place.name}
                        </h4>

                        <button
                          type="button"
                          title="Xóa địa điểm khỏi ngày này"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItineraryItem(item.itemId, place.placeId);
                          }}
                          className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-700">
                          {CATEGORY_LABEL_MAP[place.category] ||
                            place.subcategory ||
                            'Điểm tham quan'}
                        </span>

                        {hasRating ? (
                          <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {formatRatingLabel(place.rating)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-zinc-400">
                            Chưa có đánh giá
                          </span>
                        )}
                      </div>

                      {place.address && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">{place.address}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Hàng chờ chưa xếp ngày (Unassigned Pool items nếu có) */}
          {unassignedPoolItems.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
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
                            <span className="inline-flex items-center gap-0.5 font-bold text-amber-600">
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

      {/* Cột phải: Bản đồ tương tác (tự động vẽ marker & đường nối theo dayItems của ngày đang chọn) */}
      <div className="hidden md:block flex-1 h-full relative bg-zinc-100 dark:bg-zinc-950">
        <TripMapLoader places={mapPlaces} />
      </div>
    </div>
  );
}
