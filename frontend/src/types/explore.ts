export type PlaceCategoryCode = 'attraction' | 'restaurant' | 'cafe' | 'hotel';

export interface Destination {
  provinceCode: string;
  slug: string;
  name: string;
  nameEn?: string;
  fullName?: string;
  areaKm2?: number;
  centerLat?: number;
  centerLng?: number;
  poiCount?: number;
  attractionCount?: number;
}

export interface PlaceContent {
  language: string;
  contentSource: 'wikipedia' | 'wikidata' | string;
  wikidataId?: string | null;
  sourceTitle: string;
  sourceWikiUrl: string;
  revisionId?: number | null;
  summary: string;
  descriptionMd?: string | null;
  license: string;
  attribution: string;
}

export interface Place {
  placeId: number;
  name: string;
  category: PlaceCategoryCode | string;
  subcategory?: string | null;
  address: string;
  phone?: string | null;
  website?: string | null;
  openingHours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  provinceCode?: string;
  destinationName?: string;
  rating: number | null;
  reviewCount: number | null;
  photoUrl: string;
  description?: string | null;
  price?: string | null;
  tags?: string[];
  rankingScore?: number | null;
  hasContent?: boolean;
  contentLanguage?: string | null;
  content?: PlaceContent | null;
}

export interface PlaceQueryParams {
  destinationId?: string;
  q?: string;
  category?: string;
  sort?: 'popular' | 'rating_desc' | 'name_asc' | string;
  page?: number;
  size?: number;
}

export interface PaginatedPlacesResponse {
  content: Place[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
