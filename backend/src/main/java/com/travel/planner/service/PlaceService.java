package com.travel.planner.service;

import com.travel.planner.dto.PlaceDetailResponse;
import com.travel.planner.model.Place;
import com.travel.planner.repository.PlaceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;

    @Transactional(readOnly = true)
    public PlaceDetailResponse getPlaceById(Long id) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa điểm với ID: " + id));

        return mapToResponse(place);
    }

    @Transactional(readOnly = true)
    public Page<PlaceDetailResponse> getPlaces(
            String keyword,
            String destinationId,
            String category,
            String sortParam,
            Pageable pageable
    ) {
        // Chuẩn hóa tham số tìm kiếm và bộ lọc (chuỗi rỗng -> null)
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanDestinationId = (destinationId != null && !destinationId.trim().isEmpty()) ? destinationId.trim() : null;
        String cleanCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : null;

        // Xử lý sắp xếp (ưu tiên sort=rating_desc hoặc name_asc)
        Sort sort = resolveSort(sortParam, pageable);

        int page = pageable != null ? pageable.getPageNumber() : 0;
        int size = (pageable != null && pageable.getPageSize() > 0) ? pageable.getPageSize() : 20;
        Pageable finalPageable = PageRequest.of(page, size, sort);

        Page<Place> placePage = placeRepository.searchPlaces(
                cleanKeyword,
                cleanDestinationId,
                cleanCategory,
                finalPageable
        );

        return placePage.map(this::mapToResponse);
    }

    private Sort resolveSort(String sortParam, Pageable pageable) {
        if (sortParam != null && !sortParam.trim().isEmpty()) {
            String s = sortParam.trim().toLowerCase();
            if ("name_asc".equals(s) || "name,asc".equals(s)) {
                return Sort.by(Sort.Order.asc("name").nullsLast(), Sort.Order.asc("place_id"));
            }
            if ("name_desc".equals(s) || "name,desc".equals(s)) {
                return Sort.by(Sort.Order.desc("name").nullsLast(), Sort.Order.asc("place_id"));
            }
            if ("rating_asc".equals(s) || "rating,asc".equals(s)) {
                return Sort.by(Sort.Order.asc("rating").nullsLast(), Sort.Order.asc("place_id"));
            }
            if ("rating_desc".equals(s) || "rating,desc".equals(s)) {
                return Sort.by(
                        Sort.Order.desc("rating").nullsLast(),
                        Sort.Order.desc("review_count").nullsLast(),
                        Sort.Order.asc("place_id")
                );
            }
        }

        if (pageable != null && pageable.getSort().isSorted()) {
            return pageable.getSort();
        }

        // Mặc định: rating_desc (Điểm đánh giá cao nhất lên đầu)
        return Sort.by(
                Sort.Order.desc("rating").nullsLast(),
                Sort.Order.desc("review_count").nullsLast(),
                Sort.Order.asc("place_id")
        );
    }

    private PlaceDetailResponse mapToResponse(Place place) {
        return PlaceDetailResponse.builder()
                .id(place.getPlaceId())
                .name(place.getName())
                .category(place.getCategory())
                .subcategory(place.getSubcategory())
                .address(place.getAddress())
                .phone(place.getPhone())
                .website(place.getWebsite())
                .openingHours(place.getOpeningHours())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .provinceCode(place.getDestination() != null ? place.getDestination().getProvinceCode() : null)
                .rating(place.getRating())
                .reviewCount(place.getReviewCount())
                .photoUrl(place.getPhotoUrl())
                .build();
    }
}
