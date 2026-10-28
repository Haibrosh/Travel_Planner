export interface Place {
  id: string;
  name: string;
  category: string;
  lat?: number;
  lng?: number;
  time?: string;
  note?: string;
  imageUrl?: string;
}