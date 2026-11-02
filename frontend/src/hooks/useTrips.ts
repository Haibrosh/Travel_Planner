import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripService } from '@/services/trip.service';
import type { CreateTripRequest, TripResponse, UpdateTripRequest } from '@/types/trip';

export const TRIP_KEYS = {
  all: ['trips'] as const,
  lists: () => [...TRIP_KEYS.all, 'list'] as const,
  detail: (id: number | string) => [...TRIP_KEYS.all, 'detail', String(id)] as const,
};

// Hook lấy danh sách chuyến đi của người dùng hiện tại
export function useMyTrips() {
  return useQuery<TripResponse[], Error>({
    queryKey: TRIP_KEYS.lists(),
    queryFn: tripService.getMyTrips,
    staleTime: 30 * 1000, // 30s cache
  });
}

// Hook lấy chi tiết một chuyến đi theo ID
export function useTrip(tripId: number | string | undefined | null) {
  return useQuery<TripResponse, Error>({
    queryKey: TRIP_KEYS.detail(tripId ?? ''),
    queryFn: () => tripService.getTripById(tripId!),
    enabled: Boolean(tripId),
    staleTime: 60 * 1000,
  });
}

// Hook tạo chuyến đi mới (tự động invalidate cache danh sách chuyến đi)
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation<TripResponse, Error, CreateTripRequest>({
    mutationFn: tripService.createTrip,
    onSuccess: (newTrip) => {
      // Invalidate query danh sách để cập nhật lại
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.lists() });
      // Đặt trước data cho query chi tiết của trip mới
      queryClient.setQueryData(TRIP_KEYS.detail(newTrip.tripId), newTrip);
    },
  });
}

// Hook cập nhật thông tin chuyến đi (PUT /api/v1/trips/{id})
export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation<
    TripResponse,
    Error,
    { tripId: number | string; data: UpdateTripRequest }
  >({
    mutationFn: ({ tripId, data }) => tripService.updateTrip(tripId, data),
    onSuccess: (updatedTrip) => {
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.lists() });
      queryClient.setQueryData(TRIP_KEYS.detail(updatedTrip.tripId), updatedTrip);
    },
  });
}

// Hook xóa chuyến đi (DELETE /api/v1/trips/{id})
export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number | string>({
    mutationFn: tripService.deleteTrip,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: TRIP_KEYS.lists() });
      queryClient.removeQueries({ queryKey: TRIP_KEYS.detail(deletedId) });
    },
  });
}
