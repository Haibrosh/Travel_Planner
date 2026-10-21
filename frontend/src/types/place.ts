export type PlaceCategory = 'beach' | 'landmark' | 'viewpoint' | 'food';

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
}