import axiosClient from './axiosClient';
import {
  exploreService,
  getPlaceFallbackImage,
  normalizePlace,
} from './explore.service';
import type { Place } from '@/types/explore';

export interface ItineraryItemResponse {
  itemId: number;
  tripId: number;
  placeId: number;
  /** NULL nếu nằm trong danh sách chưa xếp ngày; >= 1 nếu thuộc Ngày 1, Ngày 2... */
  dayNumber: number | null;
  orderIndex: number;
  positionIndex: number;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  place: Place;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddItineraryItemRequest {
  placeId: number;
  dayNumber: number;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  /** Snapshot tùy chọn của địa điểm từ places_v2 để hiển thị tức thì */
  placeSnapshot?: Partial<Place>;
}

export interface UpdateItineraryItemRequest {
  dayNumber?: number | null;
  targetDayNumber?: number | null;
  orderIndex?: number;
  positionIndex?: number;
  prevItemId?: number | null;
  nextItemId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}

export interface ReorderItineraryItemRequest {
  prevItemId?: number | null;
  nextItemId?: number | null;
  targetDayNumber?: number | null;
  orderIndex?: number | null;
}

export interface ReorderItineraryItemEntry {
  itemId: number;
  dayNumber: number | null;
  orderIndex: number;
  positionIndex?: number;
}

export interface BatchReorderItineraryRequest {
  /** Danh sách thứ tự mới gửi lên PUT /api/v1/trips/{tripId}/itinerary/reorder */
  items: ReorderItineraryItemEntry[];
  /** Thông tin điểm vừa kéo thả (dùng cho cả batch endpoint và fallback /items/{itemId}/reorder) */
  movedItemId?: number;
  targetDayNumber?: number | null;
  prevItemId?: number | null;
  nextItemId?: number | null;
  orderIndex?: number | null;
}

export interface OptimizationResult {
  orderedItems: ItineraryItemResponse[];
  distanceBeforeKm: number;
  distanceAfterKm: number;
  distanceSavedKm: number;
}

interface ItemMetaOverride {
  note?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

const STORAGE_KEY_PREFIX = 'travelsync_itinerary_trip_';
const META_KEY_PREFIX = 'travelsync_itinerary_meta_';

function getLocalItineraryItems(tripId: string | number): ItineraryItemResponse[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${tripId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalItineraryItems(
  tripId: string | number,
  items: ItineraryItemResponse[]
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${tripId}`,
      JSON.stringify(items)
    );
  } catch {
    // Bỏ qua lỗi quota của localStorage
  }
}

function getLocalItemMetaMap(
  tripId: string | number
): Record<string, ItemMetaOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${META_KEY_PREFIX}${tripId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalItemMeta(
  tripId: string | number,
  itemId: string | number,
  patch: ItemMetaOverride
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalItemMetaMap(tripId);
    const key = String(itemId);
    current[key] = {
      ...current[key],
      ...patch,
    };
    window.localStorage.setItem(
      `${META_KEY_PREFIX}${tripId}`,
      JSON.stringify(current)
    );
  } catch {
    // Bỏ qua lỗi quota
  }
}

/**
 * Chuẩn hóa chuỗi thời gian về định dạng HH:mm:ss cho java.time.LocalTime trên Backend,
 * hoặc trả về null nếu rỗng.
 */
export function normalizeTimeForApi(time?: string | null): string | null {
  if (time === undefined || time === null) return null;
  const trimmed = time.trim();
  if (!trimmed) return null;
  // Nếu có dạng HH:mm -> thêm :00
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  // Nếu có dạng H:mm -> thêm 0 ở đầu và :00
  if (/^\d{1}:\d{2}$/.test(trimmed)) {
    return `0${trimmed}:00`;
  }
  return trimmed;
}

/**
 * Chuẩn hóa chuỗi thời gian để hiển thị gọn trên UI (HH:mm)
 */
export function formatTimeShort(time?: string | null): string {
  if (!time) return '';
  const trimmed = time.trim();
  if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
}

function extractRawItemsArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[];
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.orderedItems)) {
      return obj.orderedItems as Record<string, unknown>[];
    }
    if (Array.isArray(obj.items)) {
      return obj.items as Record<string, unknown>[];
    }
    if (Array.isArray(obj.content)) {
      return obj.content as Record<string, unknown>[];
    }
  }
  return [];
}

async function normalizeItineraryItem(
  raw: Record<string, unknown>,
  fallbackTripId: number,
  fallbackIndex: number,
  placeSnapshot?: Partial<Place>
): Promise<ItineraryItemResponse> {
  const rawPlaceObj =
    raw.place && typeof raw.place === 'object'
      ? (raw.place as Record<string, unknown>)
      : null;

  const placeId = Number(
    raw.placeId ??
      raw.place_id ??
      rawPlaceObj?.placeId ??
      rawPlaceObj?.id ??
      placeSnapshot?.placeId ??
      0
  );

  let place: Place;
  if (rawPlaceObj && (rawPlaceObj.name || rawPlaceObj.title)) {
    place = normalizePlace({
      ...placeSnapshot,
      ...rawPlaceObj,
      placeId,
    });
  } else if (raw.placeName || raw.name) {
    place = normalizePlace({
      ...placeSnapshot,
      placeId,
      name: String(raw.placeName ?? raw.name),
      category: String(raw.category ?? placeSnapshot?.category ?? 'attraction'),
      subcategory: raw.subcategory
        ? String(raw.subcategory)
        : placeSnapshot?.subcategory ?? null,
      address: String(raw.address ?? placeSnapshot?.address ?? 'Việt Nam'),
      latitude:
        raw.latitude !== undefined
          ? Number(raw.latitude)
          : placeSnapshot?.latitude ?? null,
      longitude:
        raw.longitude !== undefined
          ? Number(raw.longitude)
          : placeSnapshot?.longitude ?? null,
      rating:
        raw.rating !== undefined && raw.rating !== null
          ? Number(raw.rating)
          : placeSnapshot?.rating ?? null,
      reviewCount:
        raw.reviewCount !== undefined && raw.reviewCount !== null
          ? Number(raw.reviewCount)
          : placeSnapshot?.reviewCount ?? null,
      photoUrl: String(
        raw.photoUrl ??
          raw.imageUrl ??
          placeSnapshot?.photoUrl ??
          getPlaceFallbackImage(String(raw.category ?? placeSnapshot?.category))
      ),
    });
  } else if (placeSnapshot && placeSnapshot.name) {
    place = normalizePlace({
      ...placeSnapshot,
      placeId,
    });
  } else {
    try {
      place = await exploreService.getPlaceById(placeId);
    } catch {
      place = normalizePlace({
        placeId,
        name: `Địa điểm #${placeId}`,
        category: 'attraction',
        address: 'Việt Nam',
      });
    }
  }

  const itemId = Number(raw.itemId ?? raw.id ?? Date.now() + fallbackIndex);
  const tripId = Number(raw.tripId ?? fallbackTripId);

  const dayNumber =
    raw.dayNumber === null || raw.dayNumber === undefined
      ? null
      : Number(raw.dayNumber);

  // ItineraryItemResponse.java trả về orderIndex (từ item.getPositionIndex())
  const rawOrder = raw.orderIndex ?? raw.positionIndex;
  const resolvedOrder =
    rawOrder !== undefined && rawOrder !== null && !Number.isNaN(Number(rawOrder))
      ? Number(rawOrder)
      : fallbackIndex + 1;

  // Kết hợp metadata lưu cục bộ (note / giờ đã xóa) nếu Backend chưa trả về cột note
  const metaMap = getLocalItemMetaMap(tripId);
  const itemMeta = metaMap[String(itemId)];

  const rawStartTime = raw.startTime ? formatTimeShort(String(raw.startTime)) : null;
  const rawEndTime = raw.endTime ? formatTimeShort(String(raw.endTime)) : null;
  const rawNote =
    raw.note !== undefined && raw.note !== null ? String(raw.note) : null;

  const finalStartTime =
    rawStartTime ??
    (itemMeta?.startTime !== undefined ? itemMeta.startTime : null);
  const finalEndTime =
    rawEndTime ?? (itemMeta?.endTime !== undefined ? itemMeta.endTime : null);
  const finalNote =
    rawNote ?? (itemMeta?.note !== undefined ? itemMeta.note : null);

  return {
    itemId,
    tripId,
    placeId,
    dayNumber:
      dayNumber !== null && !Number.isNaN(dayNumber) && dayNumber > 0
        ? dayNumber
        : null,
    orderIndex: resolvedOrder,
    positionIndex: resolvedOrder,
    startTime: finalStartTime,
    endTime: finalEndTime,
    note: finalNote,
    place,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

export function sortItineraryItems(
  items: ItineraryItemResponse[]
): ItineraryItemResponse[] {
  return [...items].sort((a, b) => {
    if (a.dayNumber === null && b.dayNumber !== null) return 1;
    if (a.dayNumber !== null && b.dayNumber === null) return -1;
    if (a.dayNumber !== b.dayNumber) {
      return (a.dayNumber ?? 0) - (b.dayNumber ?? 0);
    }
    return a.orderIndex - b.orderIndex;
  });
}

export const itineraryService = {
  /**
   * Lấy toàn bộ danh sách địa điểm trong lịch trình của chuyến đi
   * GET /api/v1/trips/{tripId}/itinerary
   */
  getItinerary: async (tripId: string | number): Promise<ItineraryItemResponse[]> => {
    const numericTripId = Number(tripId);
    try {
      const response = await axiosClient.get(`/api/v1/trips/${tripId}/itinerary`);
      const rawArray = extractRawItemsArray(response);
      const normalized = await Promise.all(
        rawArray.map((item, idx) => normalizeItineraryItem(item, numericTripId, idx))
      );
      const sorted = sortItineraryItems(normalized);
      saveLocalItineraryItems(tripId, sorted);
      return sorted;
    } catch {
      return sortItineraryItems(getLocalItineraryItems(tripId));
    }
  },

  /**
   * Thêm một địa điểm vào ngày đang chọn trong lịch trình
   * POST /api/v1/trips/{tripId}/itinerary/items
   */
  addItineraryItem: async (
    tripId: string | number,
    payload: AddItineraryItemRequest
  ): Promise<ItineraryItemResponse> => {
    const numericTripId = Number(tripId);
    const safeDayNumber = Math.max(1, Number(payload.dayNumber || 1));
    const currentLocal = getLocalItineraryItems(tripId);
    const sameDayItems = currentLocal.filter((i) => i.dayNumber === safeDayNumber);

    const requestBody: {
      placeId: number;
      dayNumber: number;
      startTime?: string | null;
      endTime?: string | null;
      note?: string | null;
    } = {
      placeId: Number(payload.placeId),
      dayNumber: safeDayNumber,
    };

    const formattedStart = normalizeTimeForApi(payload.startTime);
    const formattedEnd = normalizeTimeForApi(payload.endTime);
    if (formattedStart) requestBody.startTime = formattedStart;
    if (formattedEnd) requestBody.endTime = formattedEnd;
    if (payload.note) requestBody.note = payload.note;

    try {
      const response = await axiosClient.post(
        `/api/v1/trips/${tripId}/itinerary/items`,
        requestBody
      );
      const created = await normalizeItineraryItem(
        (response as unknown as Record<string, unknown>) || requestBody,
        numericTripId,
        sameDayItems.length,
        payload.placeSnapshot
      );
      if (payload.note) {
        created.note = payload.note;
        saveLocalItemMeta(tripId, created.itemId, { note: payload.note });
      }
      const updatedList = sortItineraryItems([
        ...currentLocal.filter((i) => i.itemId !== created.itemId),
        created,
      ]);
      saveLocalItineraryItems(tripId, updatedList);
      return created;
    } catch {
      const maxPos = sameDayItems.reduce(
        (max, item) => Math.max(max, item.orderIndex),
        0
      );
      const fallbackCreated = await normalizeItineraryItem(
        {
          itemId: Date.now(),
          tripId: numericTripId,
          orderIndex: maxPos + 1,
          ...requestBody,
        },
        numericTripId,
        sameDayItems.length,
        payload.placeSnapshot
      );
      if (payload.note) {
        saveLocalItemMeta(tripId, fallbackCreated.itemId, { note: payload.note });
      }
      const updatedList = sortItineraryItems([...currentLocal, fallbackCreated]);
      saveLocalItineraryItems(tripId, updatedList);
      return fallbackCreated;
    }
  },

  /**
   * [SPRINT 6 - TASK 1]
   * Cập nhật thứ tự địa điểm khi kéo thả:
   * Gọi API PUT /api/v1/trips/{tripId}/itinerary/reorder
   * (Tự động fallback sang PUT /api/v1/trips/{tripId}/itinerary/items/{movedItemId}/reorder nếu endpoint batch chưa bật)
   */
  reorderItinerary: async (
    tripId: string | number,
    payload: BatchReorderItineraryRequest
  ): Promise<ItineraryItemResponse[]> => {
    const numericTripId = Number(tripId);
    const currentLocal = getLocalItineraryItems(tripId);

    // Cập nhật localStorage trước theo thứ tự mới
    const entryMap = new Map<number, ReorderItineraryItemEntry>();
    for (const entry of payload.items) {
      entryMap.set(Number(entry.itemId), entry);
    }

    const updatedLocal = sortItineraryItems(
      currentLocal.map((item) => {
        const matched = entryMap.get(Number(item.itemId));
        if (!matched) return item;
        return {
          ...item,
          dayNumber: matched.dayNumber,
          orderIndex: matched.orderIndex,
          positionIndex: matched.positionIndex ?? matched.orderIndex,
        };
      })
    );
    saveLocalItineraryItems(tripId, updatedLocal);

    const batchPayload = {
      items: payload.items.map((entry) => ({
        itemId: Number(entry.itemId),
        dayNumber: entry.dayNumber,
        orderIndex: entry.orderIndex,
        positionIndex: entry.positionIndex ?? entry.orderIndex,
      })),
      itemId: payload.movedItemId,
      targetDayNumber: payload.targetDayNumber,
      prevItemId: payload.prevItemId ?? null,
      nextItemId: payload.nextItemId ?? null,
      orderIndex: payload.orderIndex ?? null,
    };

    try {
      // 1. Gọi endpoint chuẩn Sprint 6: PUT /api/v1/trips/{tripId}/itinerary/reorder
      const response = await axiosClient.put(
        `/api/v1/trips/${tripId}/itinerary/reorder`,
        batchPayload
      );
      const rawArray = extractRawItemsArray(response);
      if (rawArray.length > 0) {
        const normalized = await Promise.all(
          rawArray.map((item, idx) => normalizeItineraryItem(item, numericTripId, idx))
        );
        const sorted = sortItineraryItems(normalized);
        saveLocalItineraryItems(tripId, sorted);
        return sorted;
      }
      return updatedLocal;
    } catch {
      // 2. Nếu BE nhận trực tiếp mảng (List<ReorderItem>) tại PUT /api/v1/trips/{tripId}/itinerary/reorder
      try {
        const arrayResponse = await axiosClient.put(
          `/api/v1/trips/${tripId}/itinerary/reorder`,
          batchPayload.items
        );
        const rawArray = extractRawItemsArray(arrayResponse);
        if (rawArray.length > 0) {
          const normalized = await Promise.all(
            rawArray.map((item, idx) =>
              normalizeItineraryItem(item, numericTripId, idx)
            )
          );
          const sorted = sortItineraryItems(normalized);
          saveLocalItineraryItems(tripId, sorted);
          return sorted;
        }
        return updatedLocal;
      } catch {
        // 3. Fallback sang endpoint đơn lẻ đang có trên main: PUT /api/v1/trips/{tripId}/itinerary/items/{itemId}/reorder
        if (payload.movedItemId) {
          await axiosClient.put(
            `/api/v1/trips/${tripId}/itinerary/items/${payload.movedItemId}/reorder`,
            {
              targetDayNumber: payload.targetDayNumber ?? null,
              prevItemId: payload.prevItemId ?? null,
              nextItemId: payload.nextItemId ?? null,
              orderIndex: payload.orderIndex ?? null,
            }
          );
        }
        return updatedLocal;
      }
    }
  },

  /**
   * [SPRINT 6 - TASK 3]
   * Cập nhật ghi chú (note) và thời gian tham quan (startTime, endTime) hoặc vị trí của một địa điểm
   * PUT /api/v1/trips/{tripId}/itinerary/items/{itemId}
   */
  updateItineraryItem: async (
    tripId: string | number,
    itemId: number | string,
    payload: UpdateItineraryItemRequest
  ): Promise<ItineraryItemResponse> => {
    const numericTripId = Number(tripId);
    const currentLocal = getLocalItineraryItems(tripId);
    const existing = currentLocal.find((i) => String(i.itemId) === String(itemId));

    // Lưu đồng bộ note & giờ tham quan vào meta store
    const metaPatch: ItemMetaOverride = {};
    if (payload.note !== undefined) {
      metaPatch.note = payload.note ? payload.note.trim() : null;
    }
    if (payload.startTime !== undefined) {
      metaPatch.startTime = payload.startTime
        ? formatTimeShort(payload.startTime)
        : null;
    }
    if (payload.endTime !== undefined) {
      metaPatch.endTime = payload.endTime ? formatTimeShort(payload.endTime) : null;
    }
    if (Object.keys(metaPatch).length > 0) {
      saveLocalItemMeta(tripId, itemId, metaPatch);
    }

    const targetDay =
      payload.targetDayNumber !== undefined
        ? payload.targetDayNumber
        : payload.dayNumber;

    const orderVal = payload.orderIndex ?? payload.positionIndex;

    try {
      let response: unknown;
      if (targetDay !== undefined && targetDay !== null) {
        response = await axiosClient.put(
          `/api/v1/trips/${tripId}/itinerary/items/${itemId}/reorder`,
          {
            targetDayNumber: Number(targetDay),
            prevItemId: payload.prevItemId ?? null,
            nextItemId: payload.nextItemId ?? null,
            orderIndex: orderVal ?? null,
          }
        );
      } else {
        const apiStartTime =
          payload.startTime !== undefined
            ? normalizeTimeForApi(payload.startTime)
            : normalizeTimeForApi(existing?.startTime);
        const apiEndTime =
          payload.endTime !== undefined
            ? normalizeTimeForApi(payload.endTime)
            : normalizeTimeForApi(existing?.endTime);

        response = await axiosClient.put(
          `/api/v1/trips/${tripId}/itinerary/items/${itemId}`,
          {
            startTime: apiStartTime,
            endTime: apiEndTime,
            note: payload.note !== undefined ? payload.note : existing?.note ?? null,
            prevItemId: payload.prevItemId ?? null,
            nextItemId: payload.nextItemId ?? null,
            orderIndex: orderVal ?? null,
          }
        );
      }

      const updated = await normalizeItineraryItem(
        (response as Record<string, unknown>) || {
          ...existing,
          ...payload,
          itemId,
        },
        numericTripId,
        0,
        existing?.place
      );

      // Đảm bảo giá trị người dùng vừa sửa (kể cả khi xóa trắng giờ hoặc sửa note) được phản ánh chính xác
      if (payload.note !== undefined) {
        updated.note = payload.note ? payload.note.trim() : null;
      }
      if (payload.startTime !== undefined) {
        updated.startTime = payload.startTime
          ? formatTimeShort(payload.startTime)
          : null;
      }
      if (payload.endTime !== undefined) {
        updated.endTime = payload.endTime ? formatTimeShort(payload.endTime) : null;
      }

      const nextList = sortItineraryItems(
        currentLocal.map((i) => (String(i.itemId) === String(itemId) ? updated : i))
      );
      saveLocalItineraryItems(tripId, nextList);
      return updated;
    } catch {
      const resolvedOrder = orderVal ?? existing?.orderIndex ?? 1;
      const fallbackUpdated: ItineraryItemResponse = {
        ...(existing || {
          itemId: Number(itemId),
          tripId: numericTripId,
          placeId: 0,
          dayNumber: targetDay ?? 1,
          orderIndex: resolvedOrder,
          positionIndex: resolvedOrder,
          place: normalizePlace({ placeId: 0, name: 'Địa điểm' }),
        }),
        dayNumber:
          targetDay !== undefined ? targetDay : (existing?.dayNumber ?? 1),
        orderIndex: resolvedOrder,
        positionIndex: resolvedOrder,
        startTime:
          payload.startTime !== undefined
            ? payload.startTime
              ? formatTimeShort(payload.startTime)
              : null
            : existing?.startTime,
        endTime:
          payload.endTime !== undefined
            ? payload.endTime
              ? formatTimeShort(payload.endTime)
              : null
            : existing?.endTime,
        note:
          payload.note !== undefined
            ? payload.note
              ? payload.note.trim()
              : null
            : existing?.note,
      };
      const nextList = sortItineraryItems(
        currentLocal.map((i) =>
          String(i.itemId) === String(itemId) ? fallbackUpdated : i
        )
      );
      saveLocalItineraryItems(tripId, nextList);
      return fallbackUpdated;
    }
  },

  /**
   * Kéo thả thay đổi thứ tự 1 địa điểm
   */
  reorderItineraryItem: async (
    tripId: string | number,
    itemId: number | string,
    payload: ReorderItineraryItemRequest
  ): Promise<ItineraryItemResponse> => {
    return itineraryService.updateItineraryItem(tripId, itemId, {
      targetDayNumber: payload.targetDayNumber,
      prevItemId: payload.prevItemId,
      nextItemId: payload.nextItemId,
      orderIndex: payload.orderIndex ?? undefined,
    });
  },

  /**
   * Tối ưu lộ trình di chuyển trong 1 ngày (2-opt)
   * POST /api/v1/trips/{tripId}/optimize?dayNumber={dayNumber}
   */
  optimizeDayRoute: async (
    tripId: string | number,
    dayNumber: number
  ): Promise<OptimizationResult> => {
    const numericTripId = Number(tripId);
    const response = await axiosClient.post(`/api/v1/trips/${tripId}/optimize`, null, {
      params: { dayNumber },
    });
    const raw = (response as unknown as Record<string, unknown>) || {};
    const rawItems = extractRawItemsArray(raw);
    const orderedItems = await Promise.all(
      rawItems.map((item, idx) => normalizeItineraryItem(item, numericTripId, idx))
    );

    return {
      orderedItems,
      distanceBeforeKm: Number(raw.distanceBeforeKm ?? 0),
      distanceAfterKm: Number(raw.distanceAfterKm ?? raw.totalDistanceKm ?? 0),
      distanceSavedKm: Number(raw.distanceSavedKm ?? 0),
    };
  },

  /**
   * Xóa cứng một địa điểm khỏi lịch trình chuyến đi
   * DELETE /api/v1/trips/{tripId}/itinerary/items/{itemId}
   */
  deleteItineraryItem: async (
    tripId: string | number,
    itemId: number | string
  ): Promise<void> => {
    const currentLocal = getLocalItineraryItems(tripId);
    const nextList = currentLocal.filter((i) => String(i.itemId) !== String(itemId));
    saveLocalItineraryItems(tripId, nextList);

    try {
      await axiosClient.delete(`/api/v1/trips/${tripId}/itinerary/items/${itemId}`);
    } catch {
      // Đã xóa khỏi local cache khi offline
    }
  },
};
