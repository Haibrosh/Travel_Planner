import { useMemo } from 'react';
import { useItineraryQuery } from '@/hooks/useItinerary';
import type { ItineraryItemResponse } from '@/services/itinerary.service';
import { useTripUiStore } from '@/store/useTripUiStore';
import type { TripResponse } from '@/types/trip';
import { getTripDays } from '@/utils/tripDays';

const EMPTY_ITEMS: ItineraryItemResponse[] = [];

export type DayItineraryTrip = Pick<TripResponse, 'tripId' | 'startDate' | 'endDate'>;

// Dùng chung cho danh sách lịch trình và bản đồ: cùng một ngày, cùng một nguồn dữ liệu
// (React Query gộp các lần gọi useItineraryQuery cùng tripId thành một request)
export function useDayItinerary(trip: DayItineraryTrip) {
  const { tripId, startDate, endDate } = trip;
  const days = useMemo(() => getTripDays(startDate, endDate), [startDate, endDate]);

  const selectedDayNumber = useTripUiStore((s) => s.selectedDayNumber);
  const setActiveDayNumber = useTripUiStore((s) => s.setSelectedDayNumber);
  // Ngày đang chọn phải nằm trong phạm vi chuyến đi
  const activeDayNumber = selectedDayNumber <= days.length ? selectedDayNumber : 1;

  const { data, isLoading } = useItineraryQuery(tripId);

  // Item của ngày đang chọn, theo thứ tự orderIndex (item dayNumber = null nằm ngoài)
  const dayItems = useMemo(
    () =>
      (data ?? EMPTY_ITEMS)
        .filter((item) => item.dayNumber === activeDayNumber)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    [data, activeDayNumber]
  );

  return { days, activeDayNumber, setActiveDayNumber, dayItems, isLoading };
}