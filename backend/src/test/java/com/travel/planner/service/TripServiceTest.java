package com.travel.planner.service;

import com.travel.planner.dto.TripRequest;
import com.travel.planner.dto.TripResponse;
import com.travel.planner.model.Destination;
import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.DestinationRepository;
import com.travel.planner.repository.ItineraryItemRepository;
import com.travel.planner.repository.TripRepository;
import com.travel.planner.security.TripSecurityService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private DestinationRepository destinationRepository;

    @Mock
    private ItineraryItemRepository itineraryItemRepository;

    @Mock
    private TripSecurityService tripSecurityService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private TripService tripService;

    private User owner;
    private User otherUser;
    private Destination daNang;
    private Destination quangNam;
    private Trip trip;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .userId(1L)
                .email("owner@travel.com")
                .username("owneruser")
                .build();

        otherUser = User.builder()
                .userId(2L)
                .email("other@travel.com")
                .username("otheruser")
                .build();

        daNang = Destination.builder()
                .provinceCode("DN")
                .slug("da-nang")
                .name("Đà Nẵng")
                .build();

        quangNam = Destination.builder()
                .provinceCode("QN")
                .slug("quang-nam")
                .name("Quảng Nam")
                .build();

        trip = Trip.builder()
                .tripId(10L)
                .owner(owner)
                .destination(daNang)
                .name("Du lịch Đà Nẵng")
                .description("Khám phá bán đảo Sơn Trà")
                .startDate(LocalDate.of(2026, 11, 10))
                .endDate(LocalDate.of(2026, 11, 14)) // 5 ngày
                .status("PLANNING")
                .build();
    }

    @Test
    @DisplayName("1. Tạo chuyến đi thành công (happy path)")
    void createTrip_success() {
        TripRequest request = new TripRequest();
        request.setProvinceCode("DN");
        request.setName("  Du lịch Đà Nẵng  ");
        request.setDescription("Khám phá bán đảo Sơn Trà");
        request.setStartDate(LocalDate.of(2026, 11, 10));
        request.setEndDate(LocalDate.of(2026, 11, 14));

        when(destinationRepository.findById("DN")).thenReturn(Optional.of(daNang));
        when(tripRepository.saveAndFlush(any(Trip.class))).thenAnswer(invocation -> {
            Trip toSave = invocation.getArgument(0);
            toSave.setTripId(10L);
            return toSave;
        });

        TripResponse response = tripService.createTrip(request, owner);

        assertThat(response).isNotNull();
        assertThat(response.getTripId()).isEqualTo(10L);
        assertThat(response.getOwnerId()).isEqualTo(1L);
        assertThat(response.getProvinceCode()).isEqualTo("DN");
        assertThat(response.getName()).isEqualTo("Du lịch Đà Nẵng");
        assertThat(response.getStatus()).isEqualTo("PLANNING");
        verify(entityManager).refresh(any(Trip.class));
    }

    @Test
    @DisplayName("2. Tạo chuyến đi thất bại khi endDate nhỏ hơn startDate")
    void createTrip_endDateBeforeStartDate_throwsIllegalArgumentException() {
        TripRequest request = new TripRequest();
        request.setProvinceCode("DN");
        request.setName("Chuyến đi lỗi ngày");
        request.setStartDate(LocalDate.of(2026, 11, 15));
        request.setEndDate(LocalDate.of(2026, 11, 10));

        assertThatThrownBy(() -> tripService.createTrip(request, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");

        verifyNoInteractions(destinationRepository, tripRepository);
    }

    @Test
    @DisplayName("3. Tạo chuyến đi thất bại khi không tìm thấy điểm đến theo provinceCode")
    void createTrip_destinationNotFound_throwsEntityNotFoundException() {
        TripRequest request = new TripRequest();
        request.setProvinceCode("XX");
        request.setName("Chuyến đi không tồn tại");
        request.setStartDate(LocalDate.of(2026, 11, 10));
        request.setEndDate(LocalDate.of(2026, 11, 12));

        when(destinationRepository.findById("XX")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tripService.createTrip(request, owner))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("XX");

        verify(tripRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("4. Lấy danh sách chuyến đi của user hiện tại thành công")
    void getMyTrips_success() {
        when(tripRepository.findAllByOwnerIdWithDetails(1L)).thenReturn(List.of(trip));

        List<TripResponse> result = tripService.getMyTrips(owner);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTripId()).isEqualTo(10L);
        assertThat(result.get(0).getOwnerId()).isEqualTo(1L);
        assertThat(result.get(0).getProvinceCode()).isEqualTo("DN");
    }

    @Test
    @DisplayName("5. Xem chi tiết chuyến đi thành công khi là chủ sở hữu")
    void getTripById_owner_success() {
        when(tripSecurityService.getTripIfOwner(10L, owner)).thenReturn(trip);

        TripResponse result = tripService.getTripById(10L, owner);

        assertThat(result).isNotNull();
        assertThat(result.getTripId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("Du lịch Đà Nẵng");
    }

    @Test
    @DisplayName("6. Xem chi tiết chuyến đi thất bại -> ném AccessDeniedException khi không phải owner")
    void getTripById_notOwner_throwsAccessDeniedException() {
        when(tripSecurityService.getTripIfOwner(10L, otherUser))
                .thenThrow(new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác."));

        assertThatThrownBy(() -> tripService.getTripById(10L, otherUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("7. Xem chi tiết chuyến đi thất bại -> ném EntityNotFoundException khi trip không tồn tại")
    void getTripById_notFound_throwsEntityNotFoundException() {
        when(tripSecurityService.getTripIfOwner(999L, owner))
                .thenThrow(new EntityNotFoundException("Không tìm thấy chuyến đi với ID: 999"));

        assertThatThrownBy(() -> tripService.getTripById(999L, owner))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("8. Cập nhật chuyến đi giữ nguyên ngày -> không gọi điều chỉnh lịch trình")
    void updateTrip_sameDates_success() {
        TripRequest request = new TripRequest();
        request.setProvinceCode("DN");
        request.setName("  Đà Nẵng Mùa Thu  ");
        request.setDescription("Lịch trình cập nhật");
        request.setStartDate(LocalDate.of(2026, 11, 10));
        request.setEndDate(LocalDate.of(2026, 11, 14));

        when(tripSecurityService.getTripIfOwner(10L, owner)).thenReturn(trip);
        when(tripRepository.saveAndFlush(trip)).thenReturn(trip);
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));

        TripResponse response = tripService.updateTrip(10L, request, owner);

        assertThat(response.getName()).isEqualTo("Đà Nẵng Mùa Thu");
        assertThat(response.getDescription()).isEqualTo("Lịch trình cập nhật");
        verify(destinationRepository, never()).findById(any());
        verify(itineraryItemRepository, never()).unassignItemsExceedingMaxDays(any(), any());
    }

    @Test
    @DisplayName("9. Cập nhật chuyến đi đổi ngày ngắn lại & đổi điểm đến -> tự động đưa item vượt quá ngày về Pool")
    void updateTrip_datesChanged_adjustsItineraryAndUpdatesDestination() {
        TripRequest request = new TripRequest();
        request.setProvinceCode("QN");
        request.setName("Hội An 3 ngày");
        request.setDescription("Đổi sang Quảng Nam");
        request.setStartDate(LocalDate.of(2026, 11, 10));
        request.setEndDate(LocalDate.of(2026, 11, 12)); // rút ngắn còn 3 ngày

        when(tripSecurityService.getTripIfOwner(10L, owner)).thenReturn(trip);
        when(destinationRepository.findById("QN")).thenReturn(Optional.of(quangNam));
        when(tripRepository.saveAndFlush(trip)).thenReturn(trip);
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));

        TripResponse response = tripService.updateTrip(10L, request, owner);

        assertThat(response.getProvinceCode()).isEqualTo("QN");
        assertThat(response.getName()).isEqualTo("Hội An 3 ngày");
        verify(itineraryItemRepository, times(1)).unassignItemsExceedingMaxDays(10L, 3);
    }

    @Test
    @DisplayName("10. Cập nhật chuyến đi thất bại -> ném AccessDeniedException khi sai quyền truy cập")
    void updateTrip_notOwner_throwsAccessDeniedException() {
        TripRequest request = new TripRequest();
        request.setProvinceCode("DN");
        request.setName("Sửa trộm");
        request.setStartDate(LocalDate.of(2026, 11, 10));
        request.setEndDate(LocalDate.of(2026, 11, 12));

        when(tripSecurityService.getTripIfOwner(10L, otherUser))
                .thenThrow(new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác."));

        assertThatThrownBy(() -> tripService.updateTrip(10L, request, otherUser))
                .isInstanceOf(AccessDeniedException.class);

        verify(tripRepository, never()).saveAndFlush(any());
        verifyNoInteractions(itineraryItemRepository);
    }

    @Test
    @DisplayName("11. Cập nhật chuyến đi thất bại khi endDate nhỏ hơn startDate")
    void updateTrip_invalidDateRange_throwsIllegalArgumentException() {
        TripRequest request = new TripRequest();
        request.setProvinceCode("DN");
        request.setName("Ngày không hợp lệ");
        request.setStartDate(LocalDate.of(2026, 11, 15));
        request.setEndDate(LocalDate.of(2026, 11, 12));

        when(tripSecurityService.getTripIfOwner(10L, owner)).thenReturn(trip);

        assertThatThrownBy(() -> tripService.updateTrip(10L, request, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");

        verify(tripRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("12. Xóa chuyến đi thành công khi là chủ sở hữu")
    void deleteTrip_owner_success() {
        when(tripSecurityService.getTripIfOwner(10L, owner)).thenReturn(trip);

        tripService.deleteTrip(10L, owner);

        verify(tripRepository, times(1)).delete(trip);
    }

    @Test
    @DisplayName("13. Xóa chuyến đi thất bại -> ném AccessDeniedException khi sai quyền truy cập")
    void deleteTrip_notOwner_throwsAccessDeniedException() {
        when(tripSecurityService.getTripIfOwner(10L, otherUser))
                .thenThrow(new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác."));

        assertThatThrownBy(() -> tripService.deleteTrip(10L, otherUser))
                .isInstanceOf(AccessDeniedException.class);

        verify(tripRepository, never()).delete(any());
    }
}
