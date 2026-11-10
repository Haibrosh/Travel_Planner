package com.travel.planner.service;

import com.travel.planner.dto.DestinationRecommendationsResponse;
import com.travel.planner.dto.DestinationResponse;
import com.travel.planner.repository.DestinationProjection;
import com.travel.planner.repository.DestinationRepository;
import com.travel.planner.repository.PlaceProjection;
import com.travel.planner.repository.PlaceRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DestinationServiceTest {

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private PlaceRepository placeRepository;

    @InjectMocks
    private DestinationService destinationService;

    @Test
    @DisplayName("1. Lấy danh sách 34 tỉnh/thành phố thành công")
    void getAllDestinations_success() {
        DestinationProjection p = mock(DestinationProjection.class);
        when(p.getProvinceCode()).thenReturn("79");
        when(p.getSlug()).thenReturn("ho_chi_minh");
        when(p.getName()).thenReturn("Hồ Chí Minh");
        when(p.getAreaKm2()).thenReturn(6772.59);
        when(p.getCenterLat()).thenReturn(10.823099);
        when(p.getCenterLon()).thenReturn(106.629664);
        when(p.getPoiCount()).thenReturn(6877L);
        when(p.getAttractionCount()).thenReturn(1018L);
        when(p.getBboxMinLat()).thenReturn(8.5597);
        when(p.getBboxMinLon()).thenReturn(106.3562);
        when(p.getBboxMaxLat()).thenReturn(11.4981);
        when(p.getBboxMaxLon()).thenReturn(107.5124);

        when(destinationRepository.findAllDestinationsWithCentroid()).thenReturn(List.of(p));

        List<DestinationResponse> list = destinationService.getAllDestinations();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getProvinceCode()).isEqualTo("79");
        assertThat(list.get(0).getSlug()).isEqualTo("ho_chi_minh");
        assertThat(list.get(0).getPoiCount()).isEqualTo(6877L);
        assertThat(list.get(0).getAttractionCount()).isEqualTo(1018L);
        assertThat(list.get(0).getCenter()).isNotNull();
        assertThat(list.get(0).getCenter().getLat()).isEqualTo(10.823099);
        assertThat(list.get(0).getCenter().getLon()).isEqualTo(106.629664);
        assertThat(list.get(0).getCenterLng()).isEqualTo(106.629664);
        assertThat(list.get(0).getBbox()).isNotNull();
        assertThat(list.get(0).getBbox().getMinLat()).isEqualTo(8.5597);
    }

    @Test
    @DisplayName("2. Lấy chi tiết tỉnh theo slug thành công")
    void getDestinationBySlug_success() {
        DestinationProjection p = mock(DestinationProjection.class);
        when(p.getProvinceCode()).thenReturn("48");
        when(p.getSlug()).thenReturn("da_nang");
        when(p.getName()).thenReturn("Đà Nẵng");

        when(destinationRepository.findDestinationWithCentroidBySlug("da_nang")).thenReturn(Optional.of(p));

        DestinationResponse response = destinationService.getDestinationBySlug("da_nang");

        assertThat(response).isNotNull();
        assertThat(response.getProvinceCode()).isEqualTo("48");
        assertThat(response.getName()).isEqualTo("Đà Nẵng");
    }

    @Test
    @DisplayName("3. Lấy chi tiết tỉnh theo slug không tồn tại -> ném IllegalArgumentException")
    void getDestinationBySlug_notFound_throwsException() {
        when(destinationRepository.findDestinationWithCentroidBySlug("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> destinationService.getDestinationBySlug("unknown"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Không tìm thấy tỉnh/thành phố");
    }

    @Test
    @DisplayName("4. Lấy danh sách Top Recommendations của tỉnh thành công")
    void getRecommendations_success() {
        DestinationProjection destProj = mock(DestinationProjection.class);
        when(destProj.getProvinceCode()).thenReturn("48");
        when(destProj.getSlug()).thenReturn("da_nang");
        when(destProj.getName()).thenReturn("Đà Nẵng");
        when(destinationRepository.findDestinationWithCentroidBySlug("da_nang")).thenReturn(Optional.of(destProj));

        PlaceProjection placeProj = mock(PlaceProjection.class);
        when(placeProj.getPlaceId()).thenReturn(106510L);
        when(placeProj.getName()).thenReturn("Bãi biển Mỹ Khê");
        when(placeProj.getRankingScore()).thenReturn(0.9160);
        when(placeRepository.findRecommendations("48", "attraction", 10, 0))
                .thenReturn(List.of(placeProj));

        DestinationRecommendationsResponse response = destinationService.getRecommendations("da_nang", "attraction", 10, 0);

        assertThat(response).isNotNull();
        assertThat(response.getDestination().getProvinceCode()).isEqualTo("48");
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getName()).isEqualTo("Bãi biển Mỹ Khê");
    }
}
