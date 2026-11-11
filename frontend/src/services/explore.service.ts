import axiosClient from './axiosClient';
import type {
  Destination,
  PaginatedPlacesResponse,
  Place,
  PlaceCategoryCode,
  PlaceContent,
  PlaceQueryParams,
} from '@/types/explore';
import {
  DEFAULT_DESTINATIONS,
  EXPLORE_PLACES_MOCK,
  mapMockItemToPlace,
} from '@/mocks/exploreData';

/**
 * 4 mã category chuẩn của bảng analytics.places_v2
 */
export const CATEGORY_LABEL_MAP: Record<string, string> = {
  attraction: 'Điểm tham quan',
  restaurant: 'Nhà hàng',
  cafe: 'Quán cà phê',
  hotel: 'Khách sạn & Lưu trú',
  // Tương thích ngược các nhãn cũ
  sightseeing: 'Điểm tham quan',
  entertainment: 'Điểm tham quan',
  photo: 'Điểm tham quan',
  food: 'Nhà hàng',
  homestay: 'Khách sạn & Lưu trú',
};

/**
 * Bộ 4 ảnh fallback chuẩn theo từng category của places_v2
 */
export const CATEGORY_FALLBACK_IMAGES: Record<PlaceCategoryCode, string> = {
  attraction:
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
  restaurant:
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  cafe:
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  hotel:
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
};

const SUBCATEGORY_LABEL_MAP: Record<string, string> = {
  beach: 'Bãi biển',
  museum: 'Bảo tàng',
  theme_park: 'Công viên chủ đề',
  park: 'Công viên',
  viewpoint: 'Điểm ngắm cảnh',
  monument: 'Di tích & Tượng đài',
  nature_reserve: 'Khu bảo tồn thiên nhiên',
  archaeological_site: 'Di chỉ khảo cổ',
  castle: 'Lâu đài & Dinh thự',
  attraction: 'Điểm tham quan',
  hotel: 'Khách sạn',
  hostel: 'Hostel',
  guest_house: 'Nhà nghỉ & Homestay',
  resort: 'Khu nghỉ dưỡng',
  restaurant: 'Nhà hàng',
  fast_food: 'Ăn nhanh',
  cafe: 'Quán cà phê',
};

export function normalizeCategoryCode(rawCategory?: string | null): PlaceCategoryCode {
  const key = String(rawCategory || 'attraction').trim().toLowerCase();
  if (key === 'restaurant' || key === 'food') return 'restaurant';
  if (key === 'cafe') return 'cafe';
  if (key === 'hotel' || key === 'homestay' || key === 'resort') return 'hotel';
  return 'attraction';
}

export function getPlaceFallbackImage(category?: string | null): string {
  const code = normalizeCategoryCode(category);
  return CATEGORY_FALLBACK_IMAGES[code] || CATEGORY_FALLBACK_IMAGES.attraction;
}

export function formatRatingLabel(rating?: number | null): string {
  if (rating === null || rating === undefined || Number.isNaN(Number(rating))) {
    return 'Chưa có đánh giá';
  }
  return Number(rating).toFixed(1);
}

function extractPlaceContent(raw: Record<string, unknown>): PlaceContent | null {
  if (raw.content && typeof raw.content === 'object') {
    const c = raw.content as Record<string, unknown>;
    if (c.summary) {
      return {
        language: String(c.language ?? 'vi'),
        contentSource: String(c.contentSource ?? c.content_source ?? 'wikipedia'),
        wikidataId: c.wikidataId ? String(c.wikidataId) : null,
        sourceTitle: String(c.sourceTitle ?? c.source_title ?? raw.name ?? ''),
        sourceWikiUrl: String(c.sourceWikiUrl ?? c.source_wiki_url ?? ''),
        revisionId: c.revisionId !== undefined && c.revisionId !== null ? Number(c.revisionId) : null,
        summary: String(c.summary),
        descriptionMd: c.descriptionMd ? String(c.descriptionMd) : null,
        license: String(c.license ?? 'CC BY-SA 4.0'),
        attribution: String(c.attribution ?? ''),
      };
    }
  }

  // Hỗ trợ trường hợp Backend trả flat projection từ câu SQL mẫu (contentSummary, sourceWikiUrl...)
  if (raw.contentSummary) {
    return {
      language: String(raw.contentLanguage ?? 'vi'),
      contentSource: String(raw.contentSource ?? 'wikipedia'),
      wikidataId: raw.wikidataId ? String(raw.wikidataId) : null,
      sourceTitle: String(raw.sourceTitle ?? raw.name ?? ''),
      sourceWikiUrl: String(raw.sourceWikiUrl ?? ''),
      revisionId: raw.revisionId !== undefined && raw.revisionId !== null ? Number(raw.revisionId) : null,
      summary: String(raw.contentSummary),
      descriptionMd: raw.contentDescriptionMd ? String(raw.contentDescriptionMd) : null,
      license: String(raw.contentLicense ?? 'CC BY-SA 4.0'),
      attribution: String(raw.contentAttribution ?? ''),
    };
  }

  return null;
}

export function normalizePlace(raw: Partial<Place> & Record<string, unknown>): Place {
  const categoryCode = normalizeCategoryCode(String(raw.category || 'attraction'));
  const mappedCategoryLabel = CATEGORY_LABEL_MAP[categoryCode] || 'Điểm tham quan';
  const rawSubcat = raw.subcategory ? String(raw.subcategory).trim() : '';
  const mappedSubcatLabel = rawSubcat
    ? SUBCATEGORY_LABEL_MAP[rawSubcat.toLowerCase()] || rawSubcat
    : mappedCategoryLabel;

  const rawTags = Array.isArray(raw.tags)
    ? (raw.tags as string[])
    : Array.from(new Set([mappedCategoryLabel, mappedSubcatLabel].filter(Boolean)));

  // Giữ nguyên rating = null khi chưa có đánh giá (TUYỆT ĐỐI không gán cứng 4.7)
  const parsedRating =
    raw.rating !== undefined && raw.rating !== null && String(raw.rating).trim() !== ''
      ? Number(raw.rating)
      : null;

  const parsedReviewCount =
    raw.reviewCount !== undefined && raw.reviewCount !== null
      ? Number(raw.reviewCount)
      : raw.reviewsCount !== undefined && raw.reviewsCount !== null
      ? Number(raw.reviewsCount)
      : null;

  const rankingObj =
    raw.ranking && typeof raw.ranking === 'object'
      ? (raw.ranking as Record<string, unknown>)
      : null;

  const parsedRankingScore =
    raw.rankingScore !== undefined && raw.rankingScore !== null
      ? Number(raw.rankingScore)
      : rankingObj?.rankingScore !== undefined && rankingObj?.rankingScore !== null
      ? Number(rankingObj.rankingScore)
      : null;

  const parsedContent = extractPlaceContent(raw);
  const parsedHasContent =
    raw.hasContent !== undefined && raw.hasContent !== null
      ? Boolean(raw.hasContent)
      : parsedContent !== null;

  const destinationObj =
    raw.destination && typeof raw.destination === 'object'
      ? (raw.destination as Record<string, unknown>)
      : null;

  const provinceCode = raw.provinceCode
    ? String(raw.provinceCode)
    : destinationObj?.provinceCode
    ? String(destinationObj.provinceCode)
    : undefined;

  const destinationName = raw.destinationName
    ? String(raw.destinationName)
    : raw.provinceName
    ? String(raw.provinceName)
    : destinationObj?.name
    ? String(destinationObj.name)
    : raw.province
    ? String(raw.province)
    : undefined;

  const rawPhoto = raw.photoUrl ?? raw.imageUrl;
  const photoUrl =
    rawPhoto && String(rawPhoto).trim() !== ''
      ? String(rawPhoto).trim()
      : getPlaceFallbackImage(categoryCode);

  const address =
    raw.address && String(raw.address).trim() !== ''
      ? String(raw.address).trim()
      : destinationName || 'Việt Nam';

  const description = parsedContent?.summary
    ? parsedContent.summary
    : raw.description
    ? String(raw.description)
    : null;

  return {
    placeId: Number(raw.placeId ?? raw.id ?? 0),
    name: String(raw.name ?? raw.title ?? 'Địa điểm du lịch'),
    category: categoryCode,
    subcategory: mappedSubcatLabel,
    address,
    phone: raw.phone ? String(raw.phone) : null,
    website: raw.website ? String(raw.website) : null,
    openingHours: raw.openingHours ? String(raw.openingHours) : null,
    latitude: raw.latitude !== undefined && raw.latitude !== null ? Number(raw.latitude) : null,
    longitude: raw.longitude !== undefined && raw.longitude !== null ? Number(raw.longitude) : null,
    provinceCode,
    destinationName,
    rating: parsedRating !== null && !Number.isNaN(parsedRating) ? parsedRating : null,
    reviewCount:
      parsedReviewCount !== null && !Number.isNaN(parsedReviewCount) ? parsedReviewCount : null,
    photoUrl,
    description,
    price: raw.price ? String(raw.price) : null,
    tags: rawTags.length > 0 ? rawTags : [mappedCategoryLabel],
    rankingScore:
      parsedRankingScore !== null && !Number.isNaN(parsedRankingScore)
        ? parsedRankingScore
        : null,
    hasContent: parsedHasContent,
    contentLanguage: raw.contentLanguage
      ? String(raw.contentLanguage)
      : parsedContent?.language ?? null,
    content: parsedContent,
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
  const normalizedCategory =
    category && category !== 'all' ? normalizeCategoryCode(category) : 'all';

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
      Boolean(place.description && place.description.toLowerCase().includes(normalizedQuery));

    const matchCategory =
      normalizedCategory === 'all' ||
      normalizeCategoryCode(place.category) === normalizedCategory;

    return matchDestination && matchSearch && matchCategory;
  });

  if (sort === 'rating_desc') {
    list = [...list].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  } else if (sort === 'name_asc') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } else {
    // popular: ưu tiên rankingScore desc -> reviewCount desc
    list = [...list].sort(
      (a, b) =>
        (b.rankingScore ?? 0) - (a.rankingScore ?? 0) ||
        (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
    );
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

function normalizeDestinationsList(raw: unknown): Destination[] {
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown[] }).items)
    ? (raw as { items: unknown[] }).items
    : [];

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((d) => {
      const center =
        d.center && typeof d.center === 'object'
          ? (d.center as Record<string, unknown>)
          : null;
      return {
        provinceCode: String(d.provinceCode ?? d.province_code ?? ''),
        slug: String(d.slug ?? ''),
        name: String(d.name ?? ''),
        nameEn: d.nameEn ? String(d.nameEn) : undefined,
        fullName: d.fullName ? String(d.fullName) : undefined,
        areaKm2: d.areaKm2 !== undefined ? Number(d.areaKm2) : undefined,
        centerLat:
          d.centerLat !== undefined
            ? Number(d.centerLat)
            : center?.lat !== undefined
            ? Number(center.lat)
            : undefined,
        centerLng:
          d.centerLng !== undefined
            ? Number(d.centerLng)
            : d.centerLon !== undefined
            ? Number(d.centerLon)
            : center?.lon !== undefined
            ? Number(center.lon)
            : undefined,
        poiCount: d.poiCount !== undefined ? Number(d.poiCount) : undefined,
        attractionCount:
          d.attractionCount !== undefined ? Number(d.attractionCount) : undefined,
      };
    })
    .filter((d) => Boolean(d.provinceCode && d.name));
}

export const exploreService = {
  /**
   * Lấy danh sách tỉnh/thành phố (GET /api/v1/destinations)
   */
  getDestinations: async (): Promise<Destination[]> => {
    try {
      const response = await axiosClient.get('/api/v1/destinations');
      const normalized = normalizeDestinationsList(response);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      try {
        const fallbackRes = await axiosClient.get('/api/destinations');
        const normalized = normalizeDestinationsList(fallbackRes);
        if (normalized.length > 0) {
          return normalized;
        }
      } catch {
        // Fallback sang danh sách tỉnh/thành mặc định khi offline
      }
    }
    return DEFAULT_DESTINATIONS;
  },

  /**
   * Lấy danh sách địa điểm du lịch có lọc & phân trang (GET /api/v1/places)
   * Lưu ý: Spring Data Pageable nhận page 0-based (page = 0 là trang 1).
   */
  getPlaces: async (params: PlaceQueryParams = {}): Promise<PaginatedPlacesResponse> => {
    const requestedPage = Math.max(1, params.page ?? 1);
    const requestedSize = Math.max(1, params.size ?? 8);

    const queryParams: Record<string, string | number> = {
      page: requestedPage - 1, // Spring Pageable 0-indexed
      size: requestedSize,
    };

    if (params.destinationId) {
      queryParams.destinationId = params.destinationId;
    }
    if (params.q?.trim()) {
      queryParams.q = params.q.trim();
      queryParams.keyword = params.q.trim();
    }
    if (params.category && params.category !== 'all') {
      queryParams.category = normalizeCategoryCode(params.category);
    }
    if (params.sort) {
      queryParams.sort = params.sort === 'popular' ? 'rating_desc' : params.sort;
    }

    try {
      const response = await axiosClient.get('/api/v1/places', { params: queryParams });
      const raw = response as unknown as Record<string, unknown> | Record<string, unknown>[];

      if (Array.isArray(raw)) {
        const normalized = raw.map((item) =>
          normalizePlace(item as Partial<Place> & Record<string, unknown>)
        );
        const totalElements = normalized.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / requestedSize));
        return {
          content: normalized.slice(
            (requestedPage - 1) * requestedSize,
            requestedPage * requestedSize
          ),
          page: requestedPage,
          size: requestedSize,
          totalElements,
          totalPages,
        };
      }

      if (raw && typeof raw === 'object') {
        const contentArray = Array.isArray(raw.content)
          ? (raw.content as Record<string, unknown>[])
          : Array.isArray(raw.items)
          ? (raw.items as Record<string, unknown>[])
          : null;

        if (contentArray) {
          const springPageNumber =
            raw.number !== undefined && raw.number !== null
              ? Number(raw.number) + 1
              : Number(raw.page ?? requestedPage);

          return {
            content: contentArray.map((item) =>
              normalizePlace(item as Partial<Place> & Record<string, unknown>)
            ),
            page: springPageNumber,
            size: Number(raw.size ?? requestedSize),
            totalElements: Number(raw.totalElements ?? raw.total ?? contentArray.length),
            totalPages: Math.max(1, Number(raw.totalPages ?? 1)),
          };
        }
      }
    } catch {
      // Fallback sang dữ liệu mẫu khi không có kết nối mạng tới Backend
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
      // Fallback sang dữ liệu mẫu theo ID khi offline
    }

    const found = EXPLORE_PLACES_MOCK.find((item) => String(item.id) === String(placeId));
    if (found) {
      return mapMockItemToPlace(found);
    }

    throw new Error(`Không tìm thấy địa điểm #${placeId}`);
  },
};
