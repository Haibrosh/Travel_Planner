package com.travel.planner.service;

import com.travel.planner.dto.PlaceDetailResponse;
import com.travel.planner.dto.PlaceNearbyResponse;
import com.travel.planner.dto.PlaceSearchResponse;
import com.travel.planner.repository.PlaceProjection;
import com.travel.planner.repository.PlaceRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlaceServiceTest {

    @Mock
    private PlaceRepository placeRepository;

    @InjectMocks
    private PlaceService placeService;

    private PlaceProjection createMockProjection(Long placeId, String name, Double rankingScore, boolean hasContent) {
        PlaceProjection p = mock(PlaceProjection.class);
        when(p.getPlaceId()).thenReturn(placeId);
        when(p.getName()).thenReturn(name);
        when(p.getCategory()).thenReturn("attraction");
        when(p.getSubcategory()).thenReturn("museum");
        when(p.getAddress()).thenReturn("28 Võ Văn Tần, TP.HCM");
        when(p.getProvinceCode()).thenReturn("79");
        when(p.getProvinceName()).thenReturn("Hồ Chí Minh");
        when(p.getProvinceSlug()).thenReturn("ho_chi_minh");
        when(p.getRating()).thenReturn(new BigDecimal("4.5"));
        when(p.getReviewCount()).thenReturn(41595);
        when(p.getRankingScore()).thenReturn(rankingScore);
        when(p.getSubcatPart()).thenReturn(0.95);
        when(p.getWikiPart()).thenReturn(hasContent ? 1.0 : 0.0);
        when(p.getRatingPart()).thenReturn(0.90);
        when(p.getReviewPart()).thenReturn(0.9245);
        when(p.getFormulaVersion()).thenReturn("v2_20261102_balanced");
        when(p.getHasContent()).thenReturn(hasContent);

        if (hasContent) {
            when(p.getContentLanguage()).thenReturn("vi");
            when(p.getContentSource()).thenReturn("wikipedia");
            when(p.getWikidataId()).thenReturn("Q703871");
            when(p.getSourceTitle()).thenReturn("Bảo tàng Chứng tích chiến tranh");
            when(p.getSourceWikiUrl()).thenReturn("https://vi.wikipedia.org/wiki/B%E1%BA%A3o_t%C3%A0ng");
            when(p.getContentSummary()).thenReturn("Bảo tàng Chứng tích Chiến tranh là bảo tàng vì hòa bình...");
            when(p.getContentLicense()).thenReturn("CC BY-SA 4.0");
            when(p.getContentAttribution()).thenReturn("Tóm tắt từ Wikipedia (VI)...");
        }
        return p;
    }

    @Test
    @DisplayName("1. Lấy chi tiết địa điểm có bài viết Wikipedia và phân rã ranking thành công")
    void getPlaceById_withContentAndRanking_success() {
        PlaceProjection proj = createMockProjection(101584L, "Bảo tàng Chứng tích Chiến tranh", 0.9336, true);
        when(placeRepository.findPlaceDetailById(101584L)).thenReturn(Optional.of(proj));

        PlaceDetailResponse response = placeService.getPlaceById(101584L);

        assertThat(response).isNotNull();
        assertThat(response.getPlaceId()).isEqualTo(101584L);
        assertThat(response.getRankingScore()).isEqualTo(0.9336);
        assertThat(response.getRanking()).isNotNull();
        assertThat(response.getRanking().getFormulaVersion()).isEqualTo("v2_20261102_balanced");
        assertThat(response.getContent()).isNotNull();
        assertThat(response.getContent().getLanguage()).isEqualTo("vi");
        assertThat(response.getContent().getSummary()).contains("bảo tàng vì hòa bình");
        assertThat(response.getContent().getLicense()).isEqualTo("CC BY-SA 4.0");
    }

    @Test
    @DisplayName("2. Lấy chi tiết địa điểm không có bài viết Wikipedia -> content = null")
    void getPlaceById_withoutContent_returnsContentNull() {
        PlaceProjection proj = createMockProjection(97648L, "KDL Sinh Thái Cao Nguyên Hoa Đà Lạt", 0.8012, false);
        when(placeRepository.findPlaceDetailById(97648L)).thenReturn(Optional.of(proj));

        PlaceDetailResponse response = placeService.getPlaceById(97648L);

        assertThat(response).isNotNull();
        assertThat(response.getRankingScore()).isEqualTo(0.8012);
        assertThat(response.getContent()).isNull();
        assertThat(response.getHasContent()).isFalse();
    }

    @Test
    @DisplayName("3. Lấy chi tiết ID không tồn tại -> ném EntityNotFoundException")
    void getPlaceById_notFound_throwsEntityNotFoundException() {
        when(placeRepository.findPlaceDetailById(999999L)).thenReturn(Optional.empty());
        when(placeRepository.findById(999999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> placeService.getPlaceById(999999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Không tìm thấy địa điểm");
    }

    @Test
    @DisplayName("4. Tìm kiếm & phân trang địa điểm mặc định sort theo ranking_score DESC")
    void getPlaces_defaultSortsByRankingDesc() {
        PlaceProjection proj = createMockProjection(101584L, "Bảo tàng Chứng tích Chiến tranh", 0.9336, true);
        Page<PlaceProjection> mockPage = new PageImpl<>(List.of(proj), PageRequest.of(0, 20), 1);

        when(placeRepository.searchPlaces(isNull(), isNull(), isNull(), eq("ranking_desc"), any()))
                .thenReturn(mockPage);

        Page<PlaceDetailResponse> result = placeService.getPlaces(null, null, null, null, PageRequest.of(0, 20));

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getRankingScore()).isEqualTo(0.9336);
        verify(placeRepository, times(1)).searchPlaces(isNull(), isNull(), isNull(), eq("ranking_desc"), any());
    }

    @Test
    @DisplayName("5. Tìm kiếm Hybrid (Trigram + Ranking) trả về kết quả kèm combinedSearchScore")
    void searchPlacesHybrid_validQuery_success() {
        PlaceProjection proj = createMockProjection(101584L, "Bảo tàng Chứng tích Chiến tranh", 0.9336, true);
        when(proj.getTextSimilarity()).thenReturn(0.3125);
        when(proj.getCombinedSearchScore()).thenReturn(0.5920);

        when(placeRepository.searchPlacesHybrid("bảo tàng", "79", "attraction", 10))
                .thenReturn(List.of(proj));

        PlaceSearchResponse response = placeService.searchPlacesHybrid("bảo tàng", "79", "attraction", 10);

        assertThat(response).isNotNull();
        assertThat(response.getQuery()).isEqualTo("bảo tàng");
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getCombinedSearchScore()).isEqualTo(0.5920);
    }

    @Test
    @DisplayName("6. Tìm kiếm Hybrid với từ khóa < 2 ký tự -> ném IllegalArgumentException")
    void searchPlacesHybrid_shortQuery_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> placeService.searchPlacesHybrid("a", "79", null, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tối thiểu 2 ký tự");
    }

    @Test
    @DisplayName("7. Tìm kiếm địa điểm lân cận Nearby trả về danh sách kèm distanceMeters")
    void findNearbyPlaces_validCoords_success() {
        PlaceProjection proj = createMockProjection(101396L, "Dinh Độc Lập", 0.8321, true);
        when(proj.getDistanceMeters()).thenReturn(427.8);

        when(placeRepository.findNearbyPlaces(10.779365, 106.692281, 1500, "attraction", 101584L, 10))
                .thenReturn(List.of(proj));

        PlaceNearbyResponse response = placeService.findNearbyPlaces(10.779365, 106.692281, 1500, "attraction", 101584L, 10);

        assertThat(response).isNotNull();
        assertThat(response.getCenter().getLat()).isEqualTo(10.779365);
        assertThat(response.getCenter().getLon()).isEqualTo(106.692281);
        assertThat(response.getRadiusMeters()).isEqualTo(1500);
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getDistanceMeters()).isEqualTo(427.8);
    }

    @Test
    @DisplayName("8. Tìm kiếm địa điểm lân cận với tọa độ ngoài phạm vi [-90, 90] -> ném IllegalArgumentException")
    void findNearbyPlaces_invalidCoords_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> placeService.findNearbyPlaces(95.0, 106.0, 2000, null, null, 15))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Vĩ độ (lat) phải nằm trong khoảng [-90, 90]");
    }

    @Test
    @DisplayName("9. Lấy danh sách địa điểm đề xuất Top Recommendations của tỉnh")
    void getRecommendations_success() {
        PlaceProjection proj = createMockProjection(106510L, "Bãi biển Mỹ Khê", 0.9160, true);
        when(placeRepository.findRecommendations("da_nang", "attraction", 5, 0))
                .thenReturn(List.of(proj));

        List<PlaceDetailResponse> items = placeService.getRecommendations("da_nang", "attraction", 5, 0);

        assertThat(items).hasSize(1);
        assertThat(items.get(0).getName()).isEqualTo("Bãi biển Mỹ Khê");
        assertThat(items.get(0).getRankingScore()).isEqualTo(0.9160);
    }
}
