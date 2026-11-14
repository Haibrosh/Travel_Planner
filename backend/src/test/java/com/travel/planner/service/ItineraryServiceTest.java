package com.travel.planner.service;

import com.travel.planner.dto.CreateItineraryItemRequest;
import com.travel.planner.dto.ItineraryItemResponse;
import com.travel.planner.dto.ReorderItineraryItemRequest;
import com.travel.planner.dto.UpdateItineraryItemRequest;
import com.travel.planner.model.Destination;
import com.travel.planner.model.ItineraryItem;
import com.travel.planner.model.Place;
import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.ItineraryItemRepository;
import com.travel.planner.repository.PlaceRepository;
import com.travel.planner.security.TripSecurityService;
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
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItineraryServiceTest {

    @Mock
    private ItineraryItemRepository itineraryItemRepository;

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private TripSecurityService tripSecurityService;

    @InjectMocks
    private ItineraryService itineraryService;

    private User currentUser;
    private Trip trip;
    private Place place;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .userId(1L)
                .email("test@travel.com")
                .username("testuser")
                .build();

        Destination destination = Destination.builder()
                .provinceCode("QN")
                .name("Quảng Nam")
                .build();

        trip = Trip.builder()
                .tripId(10L)
                .owner(currentUser)
                .destination(destination)
                .name("Chuyến đi Hội An")
                .startDate(LocalDate.of(2026, 11, 10))
                .endDate(LocalDate.of(2026, 11, 13)) // 4 ngày
                .build();

        place = Place.builder()
                .placeId(100L)
                .name("Phố cổ Hội An")
                .category("tourism")
                .destination(destination)
                .build();
    }

    @Test
    @DisplayName("1. Lấy danh sách lịch trình thành công trả về đúng thứ tự")
    void getItinerary_success() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem item1 = ItineraryItem.builder()
                .itemId(1L)
                .trip(trip)
                .place(place)
                .dayNumber(1)
                .positionIndex(1.0)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .build();

        ItineraryItem item2 = ItineraryItem.builder()
                .itemId(2L)
                .trip(trip)
                .place(place)
                .dayNumber(1)
                .positionIndex(2.0)
                .startTime(LocalTime.of(10, 30))
                .endTime(LocalTime.of(12, 0))
                .build();

        when(itineraryItemRepository.findAllByTripIdWithPlace(10L)).thenReturn(List.of(item1, item2));

        List<ItineraryItemResponse> responses = itineraryService.getItinerary(10L, currentUser);

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getItemId()).isEqualTo(1L);
        assertThat(responses.get(0).getOrderIndex()).isEqualTo(1.0);
        assertThat(responses.get(1).getItemId()).isEqualTo(2L);
        assertThat(responses.get(1).getOrderIndex()).isEqualTo(2.0);
        assertThat(responses.get(0).getPlace().getName()).isEqualTo("Phố cổ Hội An");
    }

    @Test
    @DisplayName("2. Thêm địa điểm vào ngày thành công - tự động gán orderIndex ở cuối danh sách")
    void addItineraryItem_success_appendsToEnd() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);
        when(placeRepository.findById(100L)).thenReturn(Optional.of(place));
        when(itineraryItemRepository.findMaxPositionIndexByTripIdAndDayNumber(10L, 2)).thenReturn(Optional.of(2.0));

        when(itineraryItemRepository.save(any(ItineraryItem.class))).thenAnswer(invocation -> {
            ItineraryItem saved = invocation.getArgument(0);
            saved.setItemId(5L);
            return saved;
        });

        CreateItineraryItemRequest request = CreateItineraryItemRequest.builder()
                .placeId(100L)
                .dayNumber(2)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(16, 0))
                .build();

        ItineraryItemResponse response = itineraryService.addItineraryItem(10L, request, currentUser);

        assertThat(response).isNotNull();
        assertThat(response.getItemId()).isEqualTo(5L);
        assertThat(response.getDayNumber()).isEqualTo(2);
        assertThat(response.getOrderIndex()).isEqualTo(3.0); // max 2.0 + 1.0 = 3.0
    }

    @Test
    @DisplayName("3. Thêm địa điểm vào ngày chưa có điểm nào -> orderIndex khởi tạo = 1.0")
    void addItineraryItem_success_firstItemOfDay() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);
        when(placeRepository.findById(100L)).thenReturn(Optional.of(place));
        when(itineraryItemRepository.findMaxPositionIndexByTripIdAndDayNumber(10L, 1)).thenReturn(Optional.empty());

        when(itineraryItemRepository.save(any(ItineraryItem.class))).thenAnswer(invocation -> {
            ItineraryItem saved = invocation.getArgument(0);
            saved.setItemId(1L);
            return saved;
        });

        CreateItineraryItemRequest request = CreateItineraryItemRequest.builder()
                .placeId(100L)
                .dayNumber(1)
                .build();

        ItineraryItemResponse response = itineraryService.addItineraryItem(10L, request, currentUser);

        assertThat(response.getOrderIndex()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("4. Thêm địa điểm thất bại nếu dayNumber vượt quá tổng số ngày chuyến đi")
    void addItineraryItem_dayNumberExceedsMaxDays_throwsIllegalArgumentException() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);
        when(placeRepository.findById(100L)).thenReturn(Optional.of(place));

        CreateItineraryItemRequest request = CreateItineraryItemRequest.builder()
                .placeId(100L)
                .dayNumber(5) // Trip chỉ có 4 ngày (10 đến 13)
                .build();

        assertThatThrownBy(() -> itineraryService.addItineraryItem(10L, request, currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vượt quá tổng số ngày");
    }

    @Test
    @DisplayName("5. Thêm địa điểm thất bại nếu endTime trước startTime")
    void addItineraryItem_endTimeBeforeStartTime_throwsIllegalArgumentException() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);
        when(placeRepository.findById(100L)).thenReturn(Optional.of(place));

        CreateItineraryItemRequest request = CreateItineraryItemRequest.builder()
                .placeId(100L)
                .dayNumber(1)
                .startTime(LocalTime.of(15, 0))
                .endTime(LocalTime.of(14, 0))
                .build();

        assertThatThrownBy(() -> itineraryService.addItineraryItem(10L, request, currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Thời gian kết thúc (endTime) phải lớn hơn hoặc bằng thời gian bắt đầu");
    }

    @Test
    @DisplayName("6. Cập nhật thời gian tham quan thành công")
    void updateItineraryItem_success() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem existing = ItineraryItem.builder()
                .itemId(7L)
                .trip(trip)
                .place(place)
                .dayNumber(1)
                .positionIndex(1.0)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(9, 30))
                .build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(7L, 10L)).thenReturn(Optional.of(existing));
        when(itineraryItemRepository.save(any(ItineraryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateItineraryItemRequest request = UpdateItineraryItemRequest.builder()
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(11, 0))
                .note("Mua vé trước 1 ngày")
                .build();

        ItineraryItemResponse updated = itineraryService.updateItineraryItem(10L, 7L, request, currentUser);

        assertThat(updated.getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(updated.getEndTime()).isEqualTo(LocalTime.of(11, 0));
        assertThat(updated.getNote()).isEqualTo("Mua vé trước 1 ngày");
    }

    @Test
    @DisplayName("7. Cập nhật kèm reorder thành công khi truyền prevItemId/nextItemId trong PUT")
    void updateItineraryItem_withReorder_success() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem existing = ItineraryItem.builder()
                .itemId(7L)
                .trip(trip)
                .place(place)
                .dayNumber(1)
                .positionIndex(3.0)
                .build();

        ItineraryItem item1 = ItineraryItem.builder().itemId(1L).positionIndex(1.0).build();
        ItineraryItem item2 = ItineraryItem.builder().itemId(2L).positionIndex(2.0).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(7L, 10L)).thenReturn(Optional.of(existing));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(item1, item2, existing));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(1L, 10L)).thenReturn(Optional.of(item1));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(2L, 10L)).thenReturn(Optional.of(item2));

        UpdateItineraryItemRequest request = UpdateItineraryItemRequest.builder()
                .prevItemId(1L)
                .nextItemId(2L)
                .build();

        ItineraryItemResponse response = itineraryService.updateItineraryItem(10L, 7L, request, currentUser);

        assertThat(response.getOrderIndex()).isEqualTo(1.5); // (1.0 + 2.0) / 2 = 1.5
    }

    @Test
    @DisplayName("8. Xóa cứng một địa điểm khỏi lịch trình thành công")
    void deleteItineraryItem_success() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem existing = ItineraryItem.builder()
                .itemId(8L)
                .trip(trip)
                .place(place)
                .dayNumber(1)
                .positionIndex(1.0)
                .build();

        when(itineraryItemRepository.findByItemIdAndTrip_TripId(8L, 10L)).thenReturn(Optional.of(existing));

        itineraryService.deleteItineraryItem(10L, 8L, currentUser);

        verify(itineraryItemRepository, times(1)).delete(existing);
    }

    @Test
    @DisplayName("9. Không có quyền thao tác trên trip của người khác -> ném AccessDeniedException")
    void getItinerary_notOwner_throwsAccessDeniedException() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser))
                .thenThrow(new AccessDeniedException("Bạn không có quyền"));

        assertThatThrownBy(() -> itineraryService.getItinerary(10L, currentUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ==================== CÁC TEST CASE CHO REORDER & MIDPOINT ====================

    @Test
    @DisplayName("10. Kéo lên đầu ngày khi còn khoảng trống -> chia đôi (nextIndex / 2.0)")
    void reorder_moveToTop_dividesNextIndex() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemToMove = ItineraryItem.builder().itemId(3L).dayNumber(1).positionIndex(3.0).trip(trip).place(place).build();
        ItineraryItem firstItem = ItineraryItem.builder().itemId(1L).dayNumber(1).positionIndex(1.0).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(3L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(firstItem, itemToMove));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(1L, 10L)).thenReturn(Optional.of(firstItem));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .prevItemId(null)
                .nextItemId(1L)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 3L, request, currentUser);

        assertThat(response.getOrderIndex()).isEqualTo(0.5); // 1.0 / 2.0 = 0.5
        verify(itineraryItemRepository, times(1)).save(itemToMove);
    }

    @Test
    @DisplayName("11. Kéo lên đầu ngày khi đã chia nhỏ nhất (nextIndex <= MIN_INTERVAL) -> Rebalance toàn bộ")
    void reorder_moveToTop_tooSmall_triggersRebalance() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemToMove = ItineraryItem.builder().itemId(3L).dayNumber(1).positionIndex(3.0).trip(trip).place(place).build();
        ItineraryItem firstItem = ItineraryItem.builder().itemId(1L).dayNumber(1).positionIndex(0.00005).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(3L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(firstItem, itemToMove));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(1L, 10L)).thenReturn(Optional.of(firstItem));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .prevItemId(null)
                .nextItemId(1L)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 3L, request, currentUser);

        // Sau rebalance: itemToMove lên đầu nhận 1.0, firstItem nhận 2.0
        assertThat(response.getOrderIndex()).isEqualTo(1.0);
        assertThat(firstItem.getPositionIndex()).isEqualTo(2.0);
        verify(itineraryItemRepository, times(2)).save(any(ItineraryItem.class));
    }

    @Test
    @DisplayName("12. Kéo vào giữa 2 item khi còn khoảng cách -> chia đôi (prev + next) / 2.0")
    void reorder_moveToMiddle_calculatesMidpoint() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemToMove = ItineraryItem.builder().itemId(3L).dayNumber(1).positionIndex(4.0).trip(trip).place(place).build();
        ItineraryItem prevItem = ItineraryItem.builder().itemId(1L).dayNumber(1).positionIndex(1.0).build();
        ItineraryItem nextItem = ItineraryItem.builder().itemId(2L).dayNumber(1).positionIndex(2.0).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(3L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(prevItem, nextItem, itemToMove));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(1L, 10L)).thenReturn(Optional.of(prevItem));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(2L, 10L)).thenReturn(Optional.of(nextItem));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .prevItemId(1L)
                .nextItemId(2L)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 3L, request, currentUser);

        assertThat(response.getOrderIndex()).isEqualTo(1.5); // (1.0 + 2.0) / 2 = 1.5
    }

    @Test
    @DisplayName("13. Kéo vào giữa 2 item khi khoảng cách < MIN_INTERVAL -> Rebalance lại toàn bộ ngày")
    void reorder_moveToMiddle_tooSmall_triggersRebalance() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemToMove = ItineraryItem.builder().itemId(3L).dayNumber(1).positionIndex(4.0).trip(trip).place(place).build();
        ItineraryItem prevItem = ItineraryItem.builder().itemId(1L).dayNumber(1).positionIndex(1.00000).build();
        ItineraryItem nextItem = ItineraryItem.builder().itemId(2L).dayNumber(1).positionIndex(1.00005).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(3L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(prevItem, nextItem, itemToMove));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(1L, 10L)).thenReturn(Optional.of(prevItem));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(2L, 10L)).thenReturn(Optional.of(nextItem));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .prevItemId(1L)
                .nextItemId(2L)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 3L, request, currentUser);

        // Thứ tự mới: prevItem(1.0), itemToMove(2.0), nextItem(3.0)
        assertThat(prevItem.getPositionIndex()).isEqualTo(1.0);
        assertThat(response.getOrderIndex()).isEqualTo(2.0);
        assertThat(nextItem.getPositionIndex()).isEqualTo(3.0);
    }

    @Test
    @DisplayName("14. Kéo xuống cuối danh sách ngày -> prevIndex + 1.0")
    void reorder_moveToEnd_calculatesPrevPlusStep() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemToMove = ItineraryItem.builder().itemId(1L).dayNumber(1).positionIndex(1.0).trip(trip).place(place).build();
        ItineraryItem lastItem = ItineraryItem.builder().itemId(2L).dayNumber(1).positionIndex(2.5).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(1L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(itemToMove, lastItem));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(2L, 10L)).thenReturn(Optional.of(lastItem));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .prevItemId(2L)
                .nextItemId(null)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 1L, request, currentUser);

        assertThat(response.getOrderIndex()).isEqualTo(3.5); // 2.5 + 1.0 = 3.5
    }

    @Test
    @DisplayName("15. Kéo thả sang ngày khác thành công")
    void reorder_crossDay_success() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemToMove = ItineraryItem.builder().itemId(5L).dayNumber(1).positionIndex(1.0).trip(trip).place(place).build();
        ItineraryItem day2Item = ItineraryItem.builder().itemId(8L).dayNumber(2).positionIndex(2.0).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(5L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 2))
                .thenReturn(List.of(day2Item));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(8L, 10L)).thenReturn(Optional.of(day2Item));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .targetDayNumber(2)
                .prevItemId(8L)
                .nextItemId(null)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 5L, request, currentUser);

        assertThat(response.getDayNumber()).isEqualTo(2);
        assertThat(response.getOrderIndex()).isEqualTo(3.0); // 2.0 + 1.0 = 3.0
    }

    @Test
    @DisplayName("16. Kéo thả với orderIndex trực tiếp - không quá sát thì gán trực tiếp")
    void reorder_directOrderIndex_success() {
        when(tripSecurityService.getTripIfOwner(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemToMove = ItineraryItem.builder().itemId(5L).dayNumber(1).positionIndex(1.0).trip(trip).place(place).build();
        ItineraryItem otherItem = ItineraryItem.builder().itemId(6L).dayNumber(1).positionIndex(2.0).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(5L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(otherItem));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .orderIndex(1.5)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 5L, request, currentUser);

        assertThat(response.getOrderIndex()).isEqualTo(1.5);
    }
}
