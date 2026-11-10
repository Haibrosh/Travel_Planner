import axiosClient from './axiosClient';
import type {
  Destination,
  PaginatedPlacesResponse,
  Place,
  PlaceQueryParams,
} from '@/types/explore';
import {
  DEFAULT_DESTINATIONS,
  EXPLORE_PLACES_MOCK,
  mapMockItemToPlace,
} from '@/mocks/exploreData';

const CATEGORY_LABEL_MAP: Record<string, string> = {
  cafe: 'Cà phê',
  food: 'Ẩm thực',
  photo: 'Chụp ảnh',
  homestay: 'Homestay',
  sightseeing: 'Tham quan',
  entertainment: 'Vui chơi',
};

function normalizePlace(raw: Partial<Place> & Record<string, unknown>): Place {
  const categoryKey = String(raw.category || 'sightseeing');
  const mappedLabel = CATEGORY_LABEL_MAP[categoryKey] || categoryKey;
  const rawTags = Array.isArray(raw.tags)
    ? (raw.tags as string[])
    : [mappedLabel, raw.subcategory ? String(raw.subcategory) : ''].filter(Boolean);

  return {
    placeId: Number(raw.placeId ?? raw.id ?? 0),
    name: String(raw.name ?? raw.title ?? 'Địa điểm du lịch'),
    category: categoryKey,
    subcategory: raw.subcategory ? String(raw.subcategory) : mappedLabel,
    address: String(raw.address ?? ''),
    phone: raw.phone ? String(raw.phone) : null,
    website: raw.website ? String(raw.website) : null,
    openingHours: raw.openingHours ? String(raw.openingHours) : null,
    latitude: raw.latitude !== undefined && raw.latitude !== null ? Number(raw.latitude) : null,
    longitude: raw.longitude !== undefined && raw.longitude !== null ? Number(raw.longitude) : null,
    provinceCode: raw.provinceCode ? String(raw.provinceCode) : undefined,
    destinationName: raw.destinationName
      ? String(raw.destinationName)
      : raw.province
      ? String(raw.province)
      : undefined,
    rating: raw.rating !== undefined && raw.rating !== null ? Number(raw.rating) : 4.7,
    reviewCount:
      raw.reviewCount !== undefined && raw.reviewCount !== null
        ? Number(raw.reviewCount)
        : raw.reviewsCount !== undefined
        ? Number(raw.reviewsCount)
        : 100,
    photoUrl: String(
      raw.photoUrl ??
        raw.imageUrl ??
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ),
    description: raw.description ? String(raw.description) : null,
    price: raw.price ? String(raw.price) : null,
    tags: rawTags.length > 0 ? rawTags : ['Khám phá'],
  };
}

function filterAndPaginateMockPlaces(params: PlaceQueryParams): PaginatedPlacesResponse {
  const {
    destinationId = '',
    q = '',
    category = 'all',
    sort = 'popular',
    page = 1,
    size = 8,
  } = params;

  const normalizedDest = destinationId.trim().toLowerCase();
  const normalizedQuery = q.trim().toLowerCase();

  let list = EXPLORE_PLACES_MOCK.map(mapMockItemToPlace).filter((place) => {
    const matchDestination =
      !normalizedDest ||
      place.provinceCode?.toLowerCase() === normalizedDest ||
      place.destinationName?.toLowerCase().includes(normalizedDest) ||
      place.address.toLowerCase().includes(normalizedDest);

    const matchSearch =
      !normalizedQuery ||
      place.name.toLowerCase().includes(normalizedQuery) ||
      place.address.toLowerCase().includes(normalizedQuery) ||
      (place.description && place.description.toLowerCase().includes(normalizedQuery));

    const categoryLabel = CATEGORY_LABEL_MAP[category] || category;
    const matchCategory =
      !category ||
      category === 'all' ||
      place.category.toLowerCase() === category.toLowerCase() ||
      (place.tags && place.tags.some((t) => t.toLowerCase() === categoryLabel.toLowerCase()));

    return matchDestination && matchSearch && matchCategory;
  });

  if (sort === 'rating_desc') {
    list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else if (sort === 'name_asc') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } else {
    // popular: sort by reviewCount desc
    list = [...list].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
  }

  const totalElements = list.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * size;
  const content = list.slice(startIndex, startIndex + size);

  return {
    content,
    page: safePage,
    size,
    totalElements,
    totalPages,
  };
}

export const exploreService = {
  /**
   * Lấy danh sách tỉnh/thành phố (GET /api/v1/destinations hoặc /api/destinations)
   */
  getDestinations: async (): Promise<Destination[]> => {
    try {
      const response = await axiosClient.get<Destination[]>('/api/v1/destinations');
      const data = response as unknown as Destination[];
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      try {
        const fallbackRes = await axiosClient.get<Destination[]>('/api/destinations');
        const data = fallbackRes as unknown as Destination[];
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch {
        // Fallback sang danh sách tỉnh/thành mặc định khi BE chưa bật
      }
    }
    return DEFAULT_DESTINATIONS;
  },

  /**
   * Lấy danh sách địa điểm du lịch có lọc & phân trang (GET /api/v1/places)
   * Params: destinationId, q, category, sort, page, size
   */
  getPlaces: async (params: PlaceQueryParams = {}): Promise<PaginatedPlacesResponse> => {
    const queryParams: Record<string, string | number> = {
      page: params.page ?? 1,
      size: params.size ?? 8,
    };

    if (params.destinationId) queryParams.destinationId = params.destinationId;
    if (params.q?.trim()) queryParams.q = params.q.trim();
    if (params.category && params.category !== 'all') queryParams.category = params.category;
    if (params.sort) queryParams.sort = params.sort;

    try {
      const response = await axiosClient.get('/api/v1/places', { params: queryParams });
      const raw = response as unknown as
        | PaginatedPlacesResponse
        | (Partial<Place> & Record<string, unknown>)[];

      if (Array.isArray(raw)) {
        const normalized = raw.map(normalizePlace);
        const size = params.size ?? 8;
        const page = params.page ?? 1;
        const totalElements = normalized.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / size));
        return {
          content: normalized.slice((page - 1) * size, page * size),
          page,
          size,
          totalElements,
          totalPages,
        };
      }

      if (raw && Array.isArray(raw.content)) {
        return {
          content: raw.content.map((item) =>
            normalizePlace(item as Partial<Place> & Record<string, unknown>)
          ),
          page: Number(raw.page ?? params.page ?? 1),
          size: Number(raw.size ?? params.size ?? 8),
          totalElements: Number(raw.totalElements ?? raw.content.length),
          totalPages: Math.max(1, Number(raw.totalPages ?? 1)),
        };
      }
    } catch {
      // Fallback sang dữ liệu mẫu khi API /api/v1/places của Tiên chưa được bật
    }

    return filterAndPaginateMockPlaces(params);
  },

  /**
   * Lấy chi tiết 1 địa điểm theo ID (GET /api/v1/places/{id})
   */
  getPlaceById: async (placeId: number | string): Promise<Place> => {
    try {
      const response = await axiosClient.get(`/api/v1/places/${placeId}`);
      const raw = response as unknown as Partial<Place> & Record<string, unknown>;
      if (raw && (raw.placeId || raw.id || raw.name)) {
        return normalizePlace(raw);
      }
    } catch {
      // Fallback sang dữ liệu mẫu theo ID
    }

    const found = EXPLORE_PLACES_MOCK.find((item) => String(item.id) === String(placeId));
    if (found) {
      return mapMockItemToPlace(found);
    }

    throw new Error(`Không tìm thấy địa điểm #${placeId}`);
  },
};
