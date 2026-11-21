'use client';

import { useMemo } from 'react';
import TripMapLoader from '@/components/map/TripMapLoader';
import { useDayItinerary, type DayItineraryTrip } from '@/hooks/useDayItinerary';
import { toMapPlaces } from './ItineraryMappers';

// Bản đồ của ngày đang chọn: marker đánh số theo thứ tự lịch trình
export default function ItineraryMap({ trip }: { trip: DayItineraryTrip }) {
  const { dayItems } = useDayItinerary(trip);
  const places = useMemo(() => toMapPlaces(dayItems), [dayItems]);
  return <TripMapLoader places={places} />;
}