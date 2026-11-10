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
  /** NULL nếu nằm trong Pool chưa xếp ngày; >= 1 nếu thuộc Ngày 1, Ngày 2... */
  dayNumber: number | null;
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
  dayNumber: number | null;
  positionIndex?: number;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  /** Snapshot tùy chọn của địa điểm từ places_v2 để hiển thị tức thì */
  placeSnapshot?: Partial<Place>;
}

export interface UpdateItineraryItemRequest {
  dayNumber?: number | null;
  positionIndex?: number;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
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
    if (Array.isArray(obj.items)) {
      return obj.items as Record<string, unknown>[];
    }
    if (Array.isArray(obj.content)) {
      return obj.content as Record<string, unknown>[];
    }
    // Hỗ trợ cấu trúc gom nhóm theo days + pool (nếu BE trả dạng grouped)
    if (Array.isArray(obj.days)) {
      const flattened: Record<string, unknown>[] = [];
      for (const dayGroup of obj.days as Record<string, unknown>[]) {
        const dayNum =
          dayGroup.dayNumber !== undefined && dayGroup.dayNumber !== null
            ? Number(dayGroup.dayNumber)
            : null;
        if (Array.isArray(dayGroup.items)) {
          for (const item of dayGroup.items as Record<string, unknown>[]) {
            flattened.push({
              ...item,
              dayNumber: item.dayNumber ?? dayNum,
            });
          }
        }
      }
      if (Array.isArray(obj.pool)) {
        for (const poolItem of obj.pool as Record<string, unknown>[]) {
          flattened.push({
            ...poolItem,
            dayNumber: null,
          });
        }
      }
      return flattened;
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

  const positionIndex =
    raw.positionIndex !== undefined && raw.positionIndex !== null
      ? Number(raw.positionIndex)
      : fallbackIndex + 1;

  return {
    itemId: Number(raw.itemId ?? raw.id ?? Date.now() + fallbackIndex),
    tripId: Number(raw.tripId ?? fallbackTripId),
    placeId,
    dayNumber: dayNumber !== null && !Number.isNaN(dayNumber) && dayNumber > 0 ? dayNumber : null,
    positionIndex: !Number.isNaN(positionIndex) ? positionIndex : fallbackIndex + 1,
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
    return a.positionIndex - b.positionIndex;
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
      try {
        const altResponse = await axiosClient.get(
          `/api/v1/trips/${tripId}/itinerary/items`
        );
        const rawArray = extractRawItemsArray(altResponse);
        const normalized = await Promise.all(
          rawArray.map((item, idx) => normalizeItineraryItem(item, numericTripId, idx))
        );
        const sorted = sortItineraryItems(normalized);
        saveLocalItineraryItems(tripId, sorted);
        return sorted;
      } catch {
        // Fallback sang cache localStorage khi API của Hồng chưa bật hoặc offline
        return sortItineraryItems(getLocalItineraryItems(tripId));
      }
    }
  },

  /**
   * Thêm một địa điểm vào ngày đang chọn (hoặc vào Pool nếu dayNumber = null)
   * POST /api/v1/trips/{tripId}/itinerary/items
   */
  addItineraryItem: async (
    tripId: string | number,
    payload: AddItineraryItemRequest
  ): Promise<ItineraryItemResponse> => {
    const numericTripId = Number(tripId);
    const currentLocal = getLocalItineraryItems(tripId);
    const sameDayItems = currentLocal.filter(
      (i) => i.dayNumber === (payload.dayNumber ?? null)
    );
    const maxPos = sameDayItems.reduce(
      (max, item) => Math.max(max, item.positionIndex),
      0
    );
    const computedPositionIndex = payload.positionIndex ?? maxPos + 1;

    const requestBody = {
      placeId: Number(payload.placeId),
      dayNumber: payload.dayNumber ?? null,
      positionIndex: computedPositionIndex,
      startTime: payload.startTime ?? null,
      endTime: payload.endTime ?? null,
      note: payload.note ?? null,
    };

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
      try {
        const altResponse = await axiosClient.post(
          `/api/v1/trips/${tripId}/itinerary`,
          requestBody
        );
        const created = await normalizeItineraryItem(
          (altResponse as unknown as Record<string, unknown>) || requestBody,
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
        // Fallback lưu localStorage khi BE chưa sẵn sàng để luồng UI hoạt động trơn tru
        const fallbackCreated = await normalizeItineraryItem(
          {
            itemId: Date.now(),
            tripId: numericTripId,
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
    }
  },

  /**
   * Cập nhật ngày / thứ tự / thời gian của địa điểm trong lịch trình
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

    try {
      const response = await axiosClient.put(
        `/api/v1/trips/${tripId}/itinerary/items/${itemId}`,
        payload
      );
      const updated = await normalizeItineraryItem(
        (response as unknown as Record<string, unknown>) || {
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
      const fallbackUpdated: ItineraryItemResponse = {
        ...(existing || {
          itemId: Number(itemId),
          tripId: numericTripId,
          placeId: 0,
          dayNumber: payload.dayNumber ?? 1,
          positionIndex: payload.positionIndex ?? 1,
          place: normalizePlace({ placeId: 0, name: 'Địa điểm' }),
        }),
        dayNumber:
          payload.dayNumber !== undefined
            ? payload.dayNumber
            : (existing?.dayNumber ?? null),
        positionIndex: payload.positionIndex ?? existing?.positionIndex ?? 1,
        startTime:
          payload.startTime !== undefined ? payload.startTime : existing?.startTime,
        endTime: payload.endTime !== undefined ? payload.endTime : existing?.endTime,
        note: payload.note !== undefined ? payload.note : existing?.note,
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
   * Xóa một địa điểm khỏi lịch trình chuyến đi
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
      try {
        await axiosClient.delete(`/api/v1/trips/${tripId}/itinerary/${itemId}`);
      } catch {
        // Đã xóa khỏi local cache khi BE chưa sẵn sàng
      }
    }
  },
};
