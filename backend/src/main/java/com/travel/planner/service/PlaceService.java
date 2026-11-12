package com.travel.planner.service;

import com.travel.planner.dto.MapCenterResponse;
import com.travel.planner.dto.PlaceDetailResponse;
import com.travel.planner.dto.PlaceNearbyResponse;
import com.travel.planner.dto.PlaceSearchResponse;
import com.travel.planner.repository.PlaceProjection;
import com.travel.planner.repository.PlaceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;

    @Transactional(readOnly = true)
    public PlaceDetailResponse getPlaceById(Long id) {
        return placeRepository.findPlaceDetailById(id)
                .map(PlaceDetailResponse::fromProjection)
                .orElseGet(() -> placeRepository.findById(id)
                        .map(PlaceDetailResponse::fromEntity)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa điểm với ID: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<PlaceDetailResponse> getPlaces(
            String keyword,
            String destinationId,
            String category,
            String sortParam,
            Pageable pageable
    ) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanDestinationId = (destinationId != null && !destinationId.trim().isEmpty()) ? destinationId.trim() : null;
        String cleanCategory = normalizeCategory(category);

        String cleanSort = resolveSortParam(sortParam, pageable);

        int page = pageable != null ? pageable.getPageNumber() : 0;
        int size = (pageable != null && pageable.getPageSize() > 0) ? pageable.getPageSize() : 20;
        Pageable finalPageable = PageRequest.of(page, size);

        Page<PlaceProjection> placePage = placeRepository.searchPlaces(
                cleanKeyword,
                cleanDestinationId,
                cleanCategory,
                cleanSort,
                finalPageable
        );

        return placePage.map(PlaceDetailResponse::fromProjection);
    }

    @Transactional(readOnly = true)
    public PlaceSearchResponse searchPlacesHybrid(String q, String provinceCode, String category, Integer limit) {
        if (q == null || q.trim().length() < 2) {
            throw new IllegalArgumentException("Từ khóa tìm kiếm (q) phải có độ dài tối thiểu 2 ký tự.");
        }

        String cleanQ = q.trim();
        String cleanProvince = (provinceCode != null && !provinceCode.trim().isEmpty()) ? provinceCode.trim() : null;
        String cleanCategory = normalizeCategory(category);
        int finalLimit = (limit != null && limit > 0) ? Math.min(limit, 30) : 10;

        List<PlaceDetailResponse> items = placeRepository.searchPlacesHybrid(cleanQ, cleanProvince, cleanCategory, finalLimit)
                .stream()
                .map(PlaceDetailResponse::fromProjection)
                .toList();

        return PlaceSearchResponse.builder()
                .query(cleanQ)
                .provinceCode(cleanProvince)
                .category(cleanCategory)
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public PlaceNearbyResponse findNearbyPlaces(Double lat, Double lon, Integer radiusMeters, String category, Long excludePlaceId, Integer limit) {
        if (lat == null || lat < -90.0 || lat > 90.0) {
            throw new IllegalArgumentException("Vĩ độ (lat) phải nằm trong khoảng [-90, 90].");
        }
        if (lon == null || lon < -180.0 || lon > 180.0) {
            throw new IllegalArgumentException("Kinh độ (lon) phải nằm trong khoảng [-180, 180].");
        }

        int finalRadius = (radiusMeters != null && radiusMeters > 0) ? Math.min(radiusMeters, 20000) : 2000;
        String cleanCategory = normalizeCategory(category);
        int finalLimit = (limit != null && limit > 0) ? Math.min(limit, 50) : 15;

        List<PlaceDetailResponse> items = placeRepository.findNearbyPlaces(lat, lon, finalRadius, cleanCategory, excludePlaceId, finalLimit)
                .stream()
                .map(PlaceDetailResponse::fromProjection)
                .toList();

        return PlaceNearbyResponse.builder()
                .center(MapCenterResponse.builder().lat(lat).lon(lon).build())
                .radiusMeters(finalRadius)
                .category(cleanCategory)
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PlaceDetailResponse> getRecommendations(String provinceSlugOrCode, String category, Integer limit, Integer offset) {
        String cleanCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : "attraction";
        int finalLimit = (limit != null && limit > 0) ? Math.min(limit, 50) : 10;
        int finalOffset = (offset != null && offset >= 0) ? offset : 0;

        return placeRepository.findRecommendations(provinceSlugOrCode, cleanCategory, finalLimit, finalOffset)
                .stream()
                .map(PlaceDetailResponse::fromProjection)
                .toList();
    }

    private String resolveSortParam(String sortParam, Pageable pageable) {
        if (sortParam != null && !sortParam.trim().isEmpty()) {
            String s = sortParam.trim().toLowerCase();
            if ("name_asc".equals(s) || "name,asc".equals(s)) {
                return "name_asc";
            }
            if ("name_desc".equals(s) || "name,desc".equals(s)) {
                return "name_desc";
            }
            if ("rating_asc".equals(s) || "rating,asc".equals(s)) {
                return "rating_asc";
            }
            if ("rating_desc".equals(s) || "rating,desc".equals(s)) {
                return "rating_desc";
            }
            if ("ranking_desc".equals(s) || "ranking,desc".equals(s) || "popular".equals(s)) {
                return "ranking_desc";
            }
        }

        if (pageable != null && pageable.getSort().isSorted()) {
            Sort.Order order = pageable.getSort().iterator().next();
            String prop = order.getProperty().toLowerCase();
            boolean isAsc = order.isAscending();
            if (prop.contains("name")) {
                return isAsc ? "name_asc" : "name_desc";
            }
            if (prop.contains("rating")) {
                return isAsc ? "rating_asc" : "rating_desc";
            }
            if (prop.contains("ranking") || prop.contains("popular")) {
                return "ranking_desc";
            }
        }

        // Mặc định: ranking_desc (Điểm xếp hạng cao nhất lên đầu)
        return "ranking_desc";
    }

    private String normalizeCategory(String category) {
        if (category == null || category.trim().isEmpty() || "all".equalsIgnoreCase(category.trim())) {
            return null;
        }
        return category.trim();
    }
}
