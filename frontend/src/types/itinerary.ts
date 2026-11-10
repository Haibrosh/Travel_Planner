import type { Place } from '@/types/place';

// Một mục trong lịch trình của một ngày (bọc Place + thông tin chuyến thăm)
export interface ItineraryItem {
  place: Place;
  tags: string[];
  note?: string;
  imageUrl?: string;
}