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
        List<DestinationProjection> projections = destinationRepository.findAllDestinationsWithCentroid();

        return projections.stream()
                .map(p -> DestinationResponse.builder()
                        .provinceCode(p.getProvinceCode())
                        .slug(p.getSlug())
                        .name(p.getName())
                        .nameEn(p.getNameEn())
                        .fullName(p.getFullName())
                        .areaKm2(p.getAreaKm2())
                        .centerLat(p.getCenterLat())
                        .centerLng(p.getCenterLng())
                        .build())
                .toList();
    }
}

