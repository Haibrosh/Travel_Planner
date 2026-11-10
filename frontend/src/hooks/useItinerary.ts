import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  itineraryService,
  type AddItineraryItemRequest,
  type ItineraryItemResponse,
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
 * Hook thêm địa điểm vào ngày đang chọn hoặc vào Pool (POST /api/v1/trips/{tripId}/itinerary/items)
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
 * Hook xóa địa điểm khỏi lịch trình chuyến đi (DELETE /api/v1/trips/{tripId}/itinerary/items/{itemId})
 */
export function useDeleteItineraryItemMutation(defaultTripId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteItineraryItemVariables | number | string>({
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
    onSuccess: (_data, variables) => {
      const targetTripId =
        typeof variables === 'object' && variables !== null
          ? (variables.tripId ?? defaultTripId)
          : defaultTripId;
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
 * Hook cập nhật ngày / vị trí của địa điểm trong lịch trình (PUT /api/v1/trips/{tripId}/itinerary/items/{itemId})
 */
export function useUpdateItineraryItemMutation(defaultTripId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation<ItineraryItemResponse, Error, UpdateItineraryItemVariables>({
    mutationFn: async ({ tripId, itemId, ...payload }) => {
      const targetTripId = tripId ?? defaultTripId;
      if (!targetTripId) {
        throw new Error('Thiếu mã chuyến đi để cập nhật lịch trình.');
      }
      return itineraryService.updateItineraryItem(targetTripId, itemId, payload);
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
