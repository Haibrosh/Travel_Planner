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
  /** NULL nếu bị đưa về danh sách chưa xếp ngày khi rút ngắn chuyến đi; >= 1 nếu thuộc Ngày 1, Ngày 2... */
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

const STORAGE_KEY_PREFIX = 'travelsync_itinerary_trip_';

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

  return {
    itemId: Number(raw.itemId ?? raw.id ?? Date.now() + fallbackIndex),
    tripId: Number(raw.tripId ?? fallbackTripId),
    placeId,
    dayNumber: dayNumber !== null && !Number.isNaN(dayNumber) && dayNumber > 0 ? dayNumber : null,
    orderIndex: resolvedOrder,
    positionIndex: resolvedOrder,
    startTime: raw.startTime ? String(raw.startTime) : null,
    endTime: raw.endTime ? String(raw.endTime) : null,
    note: raw.note ? String(raw.note) : null,
    place,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

function sortItineraryItems(items: ItineraryItemResponse[]): ItineraryItemResponse[] {
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
   * Body khớp CreateItineraryItemRequest.java: { placeId, dayNumber (>= 1), startTime, endTime }
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
    } = {
      placeId: Number(payload.placeId),
      dayNumber: safeDayNumber,
    };

    if (payload.startTime) requestBody.startTime = payload.startTime;
    if (payload.endTime) requestBody.endTime = payload.endTime;

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
      const updatedList = sortItineraryItems([...currentLocal, fallbackCreated]);
      saveLocalItineraryItems(tripId, updatedList);
      return fallbackCreated;
    }
  },

  /**
   * Cập nhật thời gian hoặc đổi ngày / thứ tự của một địa điểm trong lịch trình
   * - Đổi ngày / thứ tự: PUT /api/v1/trips/{tripId}/itinerary/items/{itemId}/reorder
   * - Đổi startTime / endTime: PUT /api/v1/trips/{tripId}/itinerary/items/{itemId}
   */
  updateItineraryItem: async (
    tripId: string | number,
    itemId: number | string,
    payload: UpdateItineraryItemRequest
  ): Promise<ItineraryItemResponse> => {
    const numericTripId = Number(tripId);
    const currentLocal = getLocalItineraryItems(tripId);
    const existing = currentLocal.find((i) => String(i.itemId) === String(itemId));

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
        response = await axiosClient.put(
          `/api/v1/trips/${tripId}/itinerary/items/${itemId}`,
          {
            startTime: payload.startTime ?? null,
            endTime: payload.endTime ?? null,
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
          payload.startTime !== undefined ? payload.startTime : existing?.startTime,
        endTime: payload.endTime !== undefined ? payload.endTime : existing?.endTime,
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
   * Kéo thả thay đổi thứ tự địa điểm (PATCH/PUT /api/v1/trips/{tripId}/itinerary/items/{itemId}/reorder)
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
