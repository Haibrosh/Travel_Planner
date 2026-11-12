package com.travel.planner.service;

import com.travel.planner.dto.*;
import com.travel.planner.repository.DestinationProjection;
import com.travel.planner.repository.DestinationRepository;
import com.travel.planner.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final PlaceRepository placeRepository;

    @Cacheable(value = "destinations", key = "'all'")
    @Transactional(readOnly = true)
    public List<DestinationResponse> getAllDestinations() {
        return destinationRepository.findAllDestinationsWithCentroid()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DestinationResponse getDestinationBySlug(String slug) {
        DestinationProjection projection = destinationRepository.findDestinationWithCentroidBySlug(slug)
                .orElseThrow(
                        () -> new IllegalArgumentException("Không tìm thấy tỉnh/thành phố với định danh: " + slug));

        return mapToResponse(projection);
    }

    @Transactional(readOnly = true)
    public List<DestinationResponse> searchDestinations(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllDestinations();
        }

        return destinationRepository.searchDestinationsWithCentroid(keyword.trim())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DestinationRecommendationsResponse getRecommendations(String slug, String category, Integer limit, Integer offset) {
        DestinationResponse dest = getDestinationBySlug(slug);

        String cleanCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : "attraction";
        int finalLimit = (limit != null && limit > 0) ? Math.min(limit, 50) : 10;
        int finalOffset = (offset != null && offset >= 0) ? offset : 0;

        List<PlaceDetailResponse> items = placeRepository.findRecommendations(
                        dest.getProvinceCode(), cleanCategory, finalLimit, finalOffset)
                .stream()
                .map(PlaceDetailResponse::fromProjection)
                .toList();

        DestinationSummaryResponse destSummary = DestinationSummaryResponse.builder()
                .provinceCode(dest.getProvinceCode())
                .slug(dest.getSlug())
                .name(dest.getName())
                .build();

        return DestinationRecommendationsResponse.builder()
                .destination(destSummary)
                .category(cleanCategory)
                .limit(finalLimit)
                .offset(finalOffset)
                .items(items)
                .build();
    }

    private DestinationResponse mapToResponse(DestinationProjection p) {
        Double lon = p.getCenterLon();
        MapCenterResponse center = null;
        if (p.getCenterLat() != null || lon != null) {
            center = MapCenterResponse.builder()
                    .lat(p.getCenterLat())
                    .lon(lon)
                    .build();
        }

        BBoxResponse bbox = null;
        if (p.getBboxMinLat() != null || p.getBboxMinLon() != null || p.getBboxMaxLat() != null || p.getBboxMaxLon() != null) {
            bbox = BBoxResponse.builder()
                    .minLat(p.getBboxMinLat())
                    .minLon(p.getBboxMinLon())
                    .maxLat(p.getBboxMaxLat())
                    .maxLon(p.getBboxMaxLon())
                    .build();
        }

        return DestinationResponse.builder()
                .provinceCode(p.getProvinceCode())
                .slug(p.getSlug())
                .name(p.getName())
                .nameEn(p.getNameEn())
                .fullName(p.getFullName())
                .areaKm2(p.getAreaKm2())
                .centerLat(p.getCenterLat())
                .centerLng(lon)
                .center(center)
                .bbox(bbox)
                .poiCount(p.getPoiCount())
                .attractionCount(p.getAttractionCount())
                .build();
    }
}
