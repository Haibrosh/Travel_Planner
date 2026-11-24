export type PlaceCategory = 'beach' | 'landmark' | 'viewpoint' | 'food';

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  // Số thứ tự trong ngày (khớp số trên thẻ); không có thì map tự đánh theo index
  order?: number;
  // Trường tùy chọn cho thẻ lịch trình (khớp props TripActivityCard)
  time?: string;
  note?: string;
  imageUrl?: string;
}
