import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  itineraryService,
  type ItineraryItemResponse,
} from '@/services/itinerary.service';
import { applyPositions, type MovePlan } from '@/utils/itineraryDnd';

/**
 * Di chuyển / sắp xếp lại item (1 plan khi kéo thả, nhiều plan khi tối ưu lộ trình).
 * Cache được cập nhật ngay (optimistic) nên bản đồ + Polyline đổi tức thì.
 */
export function useMoveItineraryItemsMutation(tripId: string | number) {
  const queryClient = useQueryClient();
  const queryKey = ['itinerary', String(tripId)];

  return useMutation<void, Error, MovePlan[], { previous?: ItineraryItemResponse[] }>({
    mutationFn: async (plans) => {
      // Gọi tuần tự để backend áp đúng thứ tự từng bước
      for (const plan of plans) {
        await itineraryService.reorderItineraryItem(tripId, plan.itemId, {
          targetDayNumber: plan.targetDayNumber,
          prevItemId: plan.prevItemId,
          nextItemId: plan.nextItemId,
          orderIndex: plan.orderIndex,
        });
      }
    },
    onMutate: async (plans) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ItineraryItemResponse[]>(queryKey);
      if (previous) {
        const next = plans.reduce(
          (acc, plan) => applyPositions(acc, plan.positions),
          previous
        );
        queryClient.setQueryData<ItineraryItemResponse[]>(queryKey, next);
      }
      return { previous };
    },
    onError: (_err, _plans, context) => {
      // Lỗi thì hoàn tác về dữ liệu cũ
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: (_data, error) => {
      if (error) queryClient.invalidateQueries({ queryKey });
    },
  });
}
