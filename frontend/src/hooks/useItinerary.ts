import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatTimeShort,
  itineraryService,
  sortItineraryItems,
  type AddItineraryItemRequest,
  type BatchReorderItineraryRequest,
  type ItineraryItemResponse,
  type OptimizationResult,
  type ReorderItineraryItemEntry,
  type UpdateItineraryItemRequest,
} from '@/services/itinerary.service';

export interface AddItineraryItemVariables extends AddItineraryItemRequest {
  tripId?: string | number;
}

export interface DeleteItineraryItemVariables {
  tripId?: string | number;
  itemId: number | string;
}

export interface UpdateItineraryItemVariables extends UpdateItineraryItemRequest {
  tripId?: string | number;
  itemId: number | string;
}

export interface ReorderItineraryVariables extends BatchReorderItineraryRequest {
  tripId?: string | number;
  /** Mảng đã sắp xếp sẵn từ UI (tùy chọn) để gán thẳng vào cache lúc onMutate */
  optimisticItems?: ItineraryItemResponse[];
}

interface OptimisticItineraryContext {
  key: string;
  previousItems?: ItineraryItemResponse[];
}

/**
 * Hook lấy danh sách lịch trình của một chuyến đi (GET /api/v1/trips/{tripId}/itinerary)
 */
export function useItineraryQuery(tripId: string | number | null | undefined) {
  return useQuery<ItineraryItemResponse[], Error>({
    queryKey: ['itinerary', String(tripId ?? '')],
    queryFn: () => itineraryService.getItinerary(tripId as string | number),
    enabled: Boolean(tripId),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook thêm địa điểm vào ngày đang chọn (POST /api/v1/trips/{tripId}/itinerary/items)
 */
export function useAddItineraryItemMutation(defaultTripId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<ItineraryItemResponse, Error, AddItineraryItemVariables>({
    mutationFn: async (variables) => {
      const targetTripId = variables.tripId ?? defaultTripId;
      if (!targetTripId) {
        throw new Error('Vui lòng chọn chuyến đi trước khi thêm địa điểm.');
      }
      return itineraryService.addItineraryItem(targetTripId, variables);
    },
    onSuccess: (_data, variables) => {
      const targetTripId = variables.tripId ?? defaultTripId;
      if (targetTripId) {
        queryClient.invalidateQueries({
          queryKey: ['itinerary', String(targetTripId)],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['itinerary'] });
    },
  });
}

/**
 * [SPRINT 6 - TASK 2]
 * Hook kéo thả đổi vị trí địa điểm với cơ chế Optimistic Update:
 * - Giữ nguyên vị trí mới ngay lập tức trên UI (0ms, không bị nháy)
 * - Gọi ngầm API PUT /api/v1/trips/{tripId}/itinerary/reorder lưu xuống DB
 * - Tự động Rollback về vị trí cũ nếu API trả lỗi
 */
export function useReorderItineraryMutation(defaultTripId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<
    ItineraryItemResponse[],
    Error,
    ReorderItineraryVariables,
    OptimisticItineraryContext
  >({
    mutationFn: async (variables) => {
      const targetTripId = variables.tripId ?? defaultTripId;
      if (!targetTripId) {
        throw new Error('Thiếu mã chuyến đi để cập nhật thứ tự lịch trình.');
      }
      return itineraryService.reorderItinerary(targetTripId, variables);
    },

    onMutate: async (variables) => {
      const targetTripId = variables.tripId ?? defaultTripId;
      const key = String(targetTripId ?? '');

      // 1. Hủy các query đang bay để tránh ghi đè trạng thái Optimistic
      await queryClient.cancelQueries({ queryKey: ['itinerary', key] });

      // 2. Chụp lại snapshot danh sách cũ để rollback nếu lỗi
      const previousItems = queryClient.getQueryData<ItineraryItemResponse[]>([
        'itinerary',
        key,
      ]);

      // 3. Cập nhật ngay lập tức thứ tự mới vào React Query cache
      if (variables.optimisticItems) {
        queryClient.setQueryData<ItineraryItemResponse[]>(
          ['itinerary', key],
          sortItineraryItems(variables.optimisticItems)
        );
      } else if (previousItems) {
        const entryMap = new Map<number, ReorderItineraryItemEntry>();
        for (const entry of variables.items) {
          entryMap.set(Number(entry.itemId), entry);
        }

        const nextItems = sortItineraryItems(
          previousItems.map((item) => {
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
        queryClient.setQueryData<ItineraryItemResponse[]>(
          ['itinerary', key],
          nextItems
        );
      }

      return { key, previousItems };
    },

    onError: (_err, _variables, context) => {
      // 4. Rollback về vị trí cũ nếu API báo lỗi
      if (context?.previousItems) {
        queryClient.setQueryData<ItineraryItemResponse[]>(
          ['itinerary', context.key],
          context.previousItems
        );
      }
    },

    onSettled: (_data, _error, _variables, context) => {
      // 5. Đồng bộ ngầm với dữ liệu chuẩn từ DB
      if (context?.key) {
        queryClient.invalidateQueries({ queryKey: ['itinerary', context.key] });
      }
    },
  });
}

/**
 * [SPRINT 6 - TASK 2 & 3]
 * Hook cập nhật ghi chú (note), giờ tham quan (startTime, endTime) hoặc ngày/vị trí của địa điểm
 * kèm Optimistic Update (cập nhật giao diện tức thì, rollback nếu API lỗi)
 */
export function useUpdateItineraryItemMutation(defaultTripId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<
    ItineraryItemResponse,
    Error,
    UpdateItineraryItemVariables,
    OptimisticItineraryContext
  >({
    mutationFn: async ({ tripId, itemId, ...payload }) => {
      const targetTripId = tripId ?? defaultTripId;
      if (!targetTripId) {
        throw new Error('Thiếu mã chuyến đi để cập nhật lịch trình.');
      }
      return itineraryService.updateItineraryItem(targetTripId, itemId, payload);
    },

    onMutate: async (variables) => {
      const targetTripId = variables.tripId ?? defaultTripId;
      const key = String(targetTripId ?? '');

      await queryClient.cancelQueries({ queryKey: ['itinerary', key] });

      const previousItems = queryClient.getQueryData<ItineraryItemResponse[]>([
        'itinerary',
        key,
      ]);

      if (previousItems) {
        const targetDay =
          variables.targetDayNumber !== undefined
            ? variables.targetDayNumber
            : variables.dayNumber;
        const nextOrder = variables.orderIndex ?? variables.positionIndex;

        const nextItems = sortItineraryItems(
          previousItems.map((item) => {
            if (String(item.itemId) !== String(variables.itemId)) return item;
            return {
              ...item,
              dayNumber: targetDay !== undefined ? targetDay : item.dayNumber,
              orderIndex: nextOrder !== undefined ? nextOrder : item.orderIndex,
              positionIndex:
                nextOrder !== undefined ? nextOrder : item.positionIndex,
              startTime:
                variables.startTime !== undefined
                  ? variables.startTime
                    ? formatTimeShort(variables.startTime)
                    : null
                  : item.startTime,
              endTime:
                variables.endTime !== undefined
                  ? variables.endTime
                    ? formatTimeShort(variables.endTime)
                    : null
                  : item.endTime,
              note:
                variables.note !== undefined
                  ? variables.note
                    ? variables.note.trim()
                    : null
                  : item.note,
            };
          })
        );

        queryClient.setQueryData<ItineraryItemResponse[]>(
          ['itinerary', key],
          nextItems
        );
      }

      return { key, previousItems };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData<ItineraryItemResponse[]>(
          ['itinerary', context.key],
          context.previousItems
        );
      }
    },

    onSettled: (_data, _error, _variables, context) => {
      if (context?.key) {
        queryClient.invalidateQueries({ queryKey: ['itinerary', context.key] });
      }
    },
  });
}

/**
 * Hook xóa địa điểm khỏi lịch trình chuyến đi kèm Optimistic Update
 * (DELETE /api/v1/trips/{tripId}/itinerary/items/{itemId})
 */
export function useDeleteItineraryItemMutation(defaultTripId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    DeleteItineraryItemVariables | number | string,
    OptimisticItineraryContext
  >({
    mutationFn: async (variables) => {
      if (typeof variables === 'number' || typeof variables === 'string') {
        if (!defaultTripId) {
          throw new Error('Thiếu mã chuyến đi để xóa địa điểm.');
        }
        return itineraryService.deleteItineraryItem(defaultTripId, variables);
      }

      const targetTripId = variables.tripId ?? defaultTripId;
      if (!targetTripId) {
        throw new Error('Thiếu mã chuyến đi để xóa địa điểm.');
      }
      return itineraryService.deleteItineraryItem(targetTripId, variables.itemId);
    },

    onMutate: async (variables) => {
      const targetTripId =
        typeof variables === 'object' && variables !== null
          ? (variables.tripId ?? defaultTripId)
          : defaultTripId;
      const itemIdToDelete =
        typeof variables === 'object' && variables !== null
          ? variables.itemId
          : variables;
      const key = String(targetTripId ?? '');

      await queryClient.cancelQueries({ queryKey: ['itinerary', key] });

      const previousItems = queryClient.getQueryData<ItineraryItemResponse[]>([
        'itinerary',
        key,
      ]);

      if (previousItems) {
        queryClient.setQueryData<ItineraryItemResponse[]>(
          ['itinerary', key],
          previousItems.filter((i) => String(i.itemId) !== String(itemIdToDelete))
        );
      }

      return { key, previousItems };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData<ItineraryItemResponse[]>(
          ['itinerary', context.key],
          context.previousItems
        );
      }
    },

    onSettled: (_data, _error, _variables, context) => {
      if (context?.key) {
        queryClient.invalidateQueries({ queryKey: ['itinerary', context.key] });
      }
    },
  });
}

/**
 * Hook gọi thuật toán tối ưu lộ trình di chuyển trong ngày (2-opt)
 * POST /api/v1/trips/{tripId}/optimize?dayNumber={dayNumber}
 */
export function useOptimizeDayRouteMutation(defaultTripId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<
    OptimizationResult,
    Error,
    { tripId?: string | number; dayNumber: number }
  >({
    mutationFn: async ({ tripId, dayNumber }) => {
      const targetTripId = tripId ?? defaultTripId;
      if (!targetTripId) {
        throw new Error('Thiếu mã chuyến đi để tối ưu lộ trình.');
      }
      return itineraryService.optimizeDayRoute(targetTripId, dayNumber);
    },
    onSuccess: (_data, variables) => {
      const targetTripId = variables.tripId ?? defaultTripId;
      if (targetTripId) {
        queryClient.invalidateQueries({
          queryKey: ['itinerary', String(targetTripId)],
        });
      }
    },
  });
}
