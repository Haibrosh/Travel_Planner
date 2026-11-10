import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { exploreService } from '@/services/explore.service';
import type {
  Destination,
  PaginatedPlacesResponse,
  Place,
  PlaceQueryParams,
} from '@/types/explore';

export const EXPLORE_KEYS = {
  all: ['explore'] as const,
  destinations: () => [...EXPLORE_KEYS.all, 'destinations'] as const,
  places: (params: PlaceQueryParams) => [...EXPLORE_KEYS.all, 'places', params] as const,
  placeDetail: (id: number | string) => [...EXPLORE_KEYS.all, 'place-detail', String(id)] as const,
};

/**
 * Hook lấy danh sách Tỉnh / Thành phố (GET /api/v1/destinations)
 */
export function useDestinations() {
  return useQuery<Destination[], Error>({
    queryKey: EXPLORE_KEYS.destinations(),
    queryFn: exploreService.getDestinations,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
}

/**
 * Hook lấy danh sách địa điểm du lịch có lọc, tìm kiếm & phân trang (GET /api/v1/places)
 */
export function usePlaces(params: PlaceQueryParams = {}) {
  return useQuery<PaginatedPlacesResponse, Error>({
    queryKey: EXPLORE_KEYS.places(params),
    queryFn: () => exploreService.getPlaces(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // Cache 1 phút
  });
}

/**
 * Hook lấy thông tin chi tiết một địa điểm (GET /api/v1/places/{id})
 */
export function usePlaceDetail(placeId: number | string | null | undefined) {
  return useQuery<Place, Error>({
    queryKey: EXPLORE_KEYS.placeDetail(placeId ?? ''),
    queryFn: () => exploreService.getPlaceById(placeId!),
    enabled: Boolean(placeId),
    staleTime: 2 * 60 * 1000,
  });
}
