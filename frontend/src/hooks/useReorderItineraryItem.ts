import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itineraryService, type ItineraryItemResponse } from '@/services/itinerary.service';

interface ReorderVariables {
  itemId: number;
  dayNumber: number;
  prevItemId: number | null; // item liền trước vị trí mới (null nếu kéo lên đầu)
  nextItemId: number | null; // item liền sau vị trí mới (null nếu kéo xuống cuối)
}

interface OptimisticContext {
  previous?: ItineraryItemResponse[];
}

// Kéo thả đổi thứ tự: cập nhật cache ngay để UI và bản đồ đổi tức thì, backend tính orderIndex thật
export function useReorderItineraryItem(tripId: number | string) {
  const queryClient = useQueryClient();
  const queryKey = ['itinerary', String(tripId)]; // trùng key của useItineraryQuery

  return useMutation<ItineraryItemResponse, Error, ReorderVariables, OptimisticContext>({
    mutationFn: ({ itemId, dayNumber, prevItemId, nextItemId }) =>
      itineraryService.reorderItineraryItem(tripId, itemId, {
        targetDayNumber: dayNumber,
        prevItemId,
        nextItemId,
      }),
    onMutate: async ({ itemId, prevItemId, nextItemId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ItineraryItemResponse[]>(queryKey);

      queryClient.setQueryData<ItineraryItemResponse[]>(queryKey, (old) => {
        if (!old) return old;
        const prev = old.find((i) => i.itemId === prevItemId);
        const next = old.find((i) => i.itemId === nextItemId);
        // Giá trị tạm nằm giữa hai item kề bên (backend sẽ trả giá trị chính thức)
        const position =
          prev && next
            ? (prev.orderIndex + next.orderIndex) / 2
            : prev
              ? prev.orderIndex + 1
              : next
                ? next.orderIndex - 1
                : 1;
        return old.map((i) =>
          i.itemId === itemId ? { ...i, orderIndex: position, positionIndex: position } : i
        );
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}