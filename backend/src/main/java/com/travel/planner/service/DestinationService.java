package com.travel.planner.service;

import com.travel.planner.dto.DestinationResponse;
import com.travel.planner.repository.DestinationProjection;
import com.travel.planner.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

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

    private DestinationResponse mapToResponse(DestinationProjection p) {
        return DestinationResponse.builder()
                .provinceCode(p.getProvinceCode())
                .slug(p.getSlug())
                .name(p.getName())
                .nameEn(p.getNameEn())
                .fullName(p.getFullName())
                .areaKm2(p.getAreaKm2())
                .centerLat(p.getCenterLat())
                .centerLng(p.getCenterLng())
                .build();
    }
}
