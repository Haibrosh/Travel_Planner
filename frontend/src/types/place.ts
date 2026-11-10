export type PlaceCategory = 'beach' | 'landmark' | 'viewpoint' | 'food';

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  // Trường tùy chọn cho thẻ lịch trình (khớp props TripActivityCard)
  time?: string;
  note?: string;
  imageUrl?: string;
}