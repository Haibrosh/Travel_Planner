package com.travel.planner.service;

import com.travel.planner.dto.CreateItineraryItemRequest;
import com.travel.planner.dto.ItineraryItemResponse;
import com.travel.planner.dto.ReorderItemRequest;
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
import java.util.Arrays;
import java.util.Collections;
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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser))
                .thenThrow(new AccessDeniedException("Bạn không có quyền"));

        assertThatThrownBy(() -> itineraryService.getItinerary(10L, currentUser))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ==================== CÁC TEST CASE CHO REORDER & MIDPOINT ====================

    @Test
    @DisplayName("10. Kéo lên đầu ngày khi còn khoảng trống -> chia đôi (nextIndex / 2.0)")
    void reorder_moveToTop_dividesNextIndex() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

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

    // ==================== CÁC TEST CASE CHO BATCH REORDER & QUYỀN TRUY CẬP ====================

    @Test
    @DisplayName("17. Batch reorder đổi thứ tự trong cùng 1 ngày thành công và chuẩn hóa index 1.0, 2.0, 3.0")
    void reorderItinerary_sameDay_success() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem item1 = ItineraryItem.builder().itemId(1L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        ItineraryItem item2 = ItineraryItem.builder().itemId(2L).trip(trip).place(place).dayNumber(1).positionIndex(2.0).build();
        ItineraryItem item3 = ItineraryItem.builder().itemId(3L).trip(trip).place(place).dayNumber(1).positionIndex(3.0).build();

        when(itineraryItemRepository.findAllByTripIdWithPlace(10L)).thenReturn(List.of(item1, item2, item3));

        List<ReorderItemRequest> requests = List.of(
                ReorderItemRequest.builder().itemId(3L).dayNumber(1).orderIndex(1.0).build(),
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(2.0).build(),
                ReorderItemRequest.builder().itemId(2L).dayNumber(1).orderIndex(3.0).build()
        );

        List<ItineraryItemResponse> result = itineraryService.reorderItinerary(10L, requests, currentUser);

        assertThat(result).hasSize(3);
        assertThat(result).extracting(ItineraryItemResponse::getItemId).containsExactly(3L, 1L, 2L);
        assertThat(result).extracting(ItineraryItemResponse::getOrderIndex).containsExactly(1.0, 2.0, 3.0);
        verify(itineraryItemRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("18. Batch reorder chuyển địa điểm sang ngày khác thành công - chuẩn hóa cả ngày nguồn và ngày đích")
    void reorderItinerary_crossDay_success() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        // Ngày 1 ban đầu: [1, 2, 3]; Ngày 2 ban đầu: [4]
        // Chuyển item 2 từ Ngày 1 sang vị trí đầu của Ngày 2 (không truyền item 1, 3 của Ngày 1)
        ItineraryItem item1 = ItineraryItem.builder().itemId(1L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        ItineraryItem item2 = ItineraryItem.builder().itemId(2L).trip(trip).place(place).dayNumber(1).positionIndex(2.0).build();
        ItineraryItem item3 = ItineraryItem.builder().itemId(3L).trip(trip).place(place).dayNumber(1).positionIndex(3.0).build();
        ItineraryItem item4 = ItineraryItem.builder().itemId(4L).trip(trip).place(place).dayNumber(2).positionIndex(1.0).build();

        when(itineraryItemRepository.findAllByTripIdWithPlace(10L)).thenReturn(List.of(item1, item2, item3, item4));

        List<ReorderItemRequest> requests = List.of(
                ReorderItemRequest.builder().itemId(2L).dayNumber(2).orderIndex(1.0).build(),
                ReorderItemRequest.builder().itemId(4L).dayNumber(2).orderIndex(2.0).build()
        );

        List<ItineraryItemResponse> result = itineraryService.reorderItinerary(10L, requests, currentUser);

        // Ngày 1 còn item 1 (1.0), item 3 (2.0) - không bị lệch index từ 1.0 nhảy lên 3.0
        // Ngày 2 có item 2 (1.0), item 4 (2.0) - không bị trùng index
        assertThat(item1.getDayNumber()).isEqualTo(1);
        assertThat(item1.getPositionIndex()).isEqualTo(1.0);
        assertThat(item3.getDayNumber()).isEqualTo(1);
        assertThat(item3.getPositionIndex()).isEqualTo(2.0);
        assertThat(item2.getDayNumber()).isEqualTo(2);
        assertThat(item2.getPositionIndex()).isEqualTo(1.0);
        assertThat(item4.getDayNumber()).isEqualTo(2);
        assertThat(item4.getPositionIndex()).isEqualTo(2.0);

        assertThat(result).extracting(ItineraryItemResponse::getItemId).containsExactly(1L, 3L, 2L, 4L);
        assertThat(result).extracting(ItineraryItemResponse::getOrderIndex).containsExactly(1.0, 2.0, 1.0, 2.0);
        verify(itineraryItemRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("19. Batch reorder tự động xử lý orderIndex trùng hoặc lệch thành 1.0, 2.0, 3.0...")
    void reorderItinerary_duplicateOrSkewedOrderIndex_normalizesIndices() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem item1 = ItineraryItem.builder().itemId(1L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        ItineraryItem item2 = ItineraryItem.builder().itemId(2L).trip(trip).place(place).dayNumber(1).positionIndex(2.0).build();
        ItineraryItem item3 = ItineraryItem.builder().itemId(3L).trip(trip).place(place).dayNumber(1).positionIndex(3.0).build();

        when(itineraryItemRepository.findAllByTripIdWithPlace(10L)).thenReturn(List.of(item1, item2, item3));

        // Client gửi orderIndex trùng (1.0, 1.0) và lệch lớn (99.5)
        List<ReorderItemRequest> requests = List.of(
                ReorderItemRequest.builder().itemId(3L).dayNumber(1).orderIndex(1.0).build(),
                ReorderItemRequest.builder().itemId(2L).dayNumber(1).orderIndex(1.0).build(),
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(99.5).build()
        );

        List<ItineraryItemResponse> result = itineraryService.reorderItinerary(10L, requests, currentUser);

        assertThat(result).extracting(ItineraryItemResponse::getItemId).containsExactly(3L, 2L, 1L);
        assertThat(result).extracting(ItineraryItemResponse::getOrderIndex).containsExactly(1.0, 2.0, 3.0);
    }

    @Test
    @DisplayName("20. Batch reorder thất bại -> ném AccessDeniedException khi sai quyền truy cập")
    void reorderItinerary_notOwner_throwsAccessDeniedException() {
        User outsider = User.builder().userId(99L).email("outsider@travel.com").username("outsider").build();
        when(tripSecurityService.getTripIfMember(10L, outsider))
                .thenThrow(new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác."));

        List<ReorderItemRequest> requests = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(1.0).build()
        );

        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, requests, outsider))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(itineraryItemRepository);
    }

    @Test
    @DisplayName("21. Batch reorder thất bại khi itemId không thuộc về chuyến đi")
    void reorderItinerary_itemNotInTrip_throwsEntityNotFoundException() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem item1 = ItineraryItem.builder().itemId(1L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        when(itineraryItemRepository.findAllByTripIdWithPlace(10L)).thenReturn(List.of(item1));

        List<ReorderItemRequest> requests = List.of(
                ReorderItemRequest.builder().itemId(999L).dayNumber(1).orderIndex(1.0).build()
        );

        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, requests, currentUser))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("999");

        verify(itineraryItemRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("22. Batch reorder thất bại khi dayNumber vượt quá tổng số ngày chuyến đi")
    void reorderItinerary_dayNumberExceedsMaxDays_throwsIllegalArgumentException() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        List<ReorderItemRequest> requests = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(10).orderIndex(1.0).build()
        );

        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, requests, currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vượt quá tổng số ngày");

        verifyNoInteractions(itineraryItemRepository);
    }

    @Test
    @DisplayName("23. Batch reorder thất bại khi danh sách rỗng")
    void reorderItinerary_emptyRequest_throwsIllegalArgumentException() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, List.of(), currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không được để trống");

        verifyNoInteractions(itineraryItemRepository);
    }

    @Test
    @DisplayName("24. Các thao tác thêm/sửa/xóa/reorder đơn lẻ đều ném AccessDeniedException khi sai quyền")
    void singleItemOperations_notOwner_throwsAccessDeniedException() {
        User outsider = User.builder().userId(99L).email("outsider@travel.com").username("outsider").build();
        when(tripSecurityService.getTripIfMember(10L, outsider))
                .thenThrow(new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác."));

        CreateItineraryItemRequest addReq = CreateItineraryItemRequest.builder().placeId(100L).dayNumber(1).build();
        UpdateItineraryItemRequest updateReq = UpdateItineraryItemRequest.builder().note("hack").build();
        ReorderItineraryItemRequest reorderReq = ReorderItineraryItemRequest.builder().orderIndex(1.0).build();

        assertThatThrownBy(() -> itineraryService.addItineraryItem(10L, addReq, outsider))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> itineraryService.updateItineraryItem(10L, 1L, updateReq, outsider))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> itineraryService.deleteItineraryItem(10L, 1L, outsider))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> itineraryService.reorderItineraryItem(10L, 1L, reorderReq, outsider))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(itineraryItemRepository, placeRepository);
    }

    // ==================== CÁC TEST CASE BỔ SUNG ĐẠT ĐỘ PHỦ CAO ====================

    @Test
    @DisplayName("25. Thêm địa điểm thất bại khi không tìm thấy Place -> ném EntityNotFoundException")
    void addItineraryItem_placeNotFound_throwsEntityNotFoundException() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        when(placeRepository.findById(999L)).thenReturn(Optional.empty());

        CreateItineraryItemRequest request = CreateItineraryItemRequest.builder()
                .placeId(999L)
                .dayNumber(1)
                .build();

        assertThatThrownBy(() -> itineraryService.addItineraryItem(10L, request, currentUser))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("999");
        verify(itineraryItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("26. Thêm địa điểm xử lý trim note hợp lệ và chuyển note toàn khoảng trắng thành null")
    void addItineraryItem_handlesNoteTrimAndBlank() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        when(placeRepository.findById(100L)).thenReturn(Optional.of(place));
        when(itineraryItemRepository.findMaxPositionIndexByTripIdAndDayNumber(10L, 1)).thenReturn(Optional.of(1.0));
        when(itineraryItemRepository.save(any(ItineraryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateItineraryItemRequest withNote = CreateItineraryItemRequest.builder()
                .placeId(100L)
                .dayNumber(1)
                .note("  Đi buổi sáng  ")
                .build();
        ItineraryItemResponse res1 = itineraryService.addItineraryItem(10L, withNote, currentUser);
        assertThat(res1.getNote()).isEqualTo("Đi buổi sáng");

        CreateItineraryItemRequest blankNote = CreateItineraryItemRequest.builder()
                .placeId(100L)
                .dayNumber(1)
                .note("   ")
                .build();
        ItineraryItemResponse res2 = itineraryService.addItineraryItem(10L, blankNote, currentUser);
        assertThat(res2.getNote()).isNull();
    }

    @Test
    @DisplayName("27. Cập nhật item thất bại khi không tìm thấy item hoặc endTime < startTime")
    void updateItineraryItem_notFoundAndInvalidTimes_throwsExceptions() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(999L, 10L)).thenReturn(Optional.empty());

        UpdateItineraryItemRequest req = UpdateItineraryItemRequest.builder().note("test").build();
        assertThatThrownBy(() -> itineraryService.updateItineraryItem(10L, 999L, req, currentUser))
                .isInstanceOf(EntityNotFoundException.class);

        ItineraryItem existing = ItineraryItem.builder().itemId(7L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(7L, 10L)).thenReturn(Optional.of(existing));

        UpdateItineraryItemRequest badTimeReq = UpdateItineraryItemRequest.builder()
                .startTime(LocalTime.of(16, 0))
                .endTime(LocalTime.of(15, 0))
                .build();
        assertThatThrownBy(() -> itineraryService.updateItineraryItem(10L, 7L, badTimeReq, currentUser))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("28. Cập nhật đồng thời thời gian/xóa note trắng và đổi vị trí orderIndex")
    void updateItineraryItem_withBlankNoteAndOrderIndex_updatesAndReorders() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem existing = ItineraryItem.builder()
                .itemId(7L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).note("Ghi chú cũ").build();
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(7L, 10L)).thenReturn(Optional.of(existing));
        when(itineraryItemRepository.save(any(ItineraryItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(existing));

        UpdateItineraryItemRequest request = UpdateItineraryItemRequest.builder()
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .note("   ")
                .orderIndex(3.0)
                .build();

        ItineraryItemResponse response = itineraryService.updateItineraryItem(10L, 7L, request, currentUser);

        assertThat(response.getNote()).isNull();
        assertThat(response.getStartTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(response.getOrderIndex()).isEqualTo(3.0);
    }

    @Test
    @DisplayName("29. Xóa item thất bại khi không tìm thấy itemId thuộc trip")
    void deleteItineraryItem_notFound_throwsEntityNotFoundException() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(999L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> itineraryService.deleteItineraryItem(10L, 999L, currentUser))
                .isInstanceOf(EntityNotFoundException.class);
        verify(itineraryItemRepository, never()).delete(any());
    }

    @Test
    @DisplayName("30. Reorder đơn lẻ thất bại khi item không tồn tại hoặc targetDayNumber không hợp lệ")
    void reorderItineraryItem_invalidItemOrTargetDay_throwsExceptions() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(999L, 10L)).thenReturn(Optional.empty());

        ReorderItineraryItemRequest req = ReorderItineraryItemRequest.builder().orderIndex(1.0).build();
        assertThatThrownBy(() -> itineraryService.reorderItineraryItem(10L, 999L, req, currentUser))
                .isInstanceOf(EntityNotFoundException.class);

        ItineraryItem item = ItineraryItem.builder().itemId(5L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(5L, 10L)).thenReturn(Optional.of(item));

        ReorderItineraryItemRequest zeroDay = ReorderItineraryItemRequest.builder().targetDayNumber(0).build();
        assertThatThrownBy(() -> itineraryService.reorderItineraryItem(10L, 5L, zeroDay, currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        ReorderItineraryItemRequest exceedDay = ReorderItineraryItemRequest.builder().targetDayNumber(10).build();
        assertThatThrownBy(() -> itineraryService.reorderItineraryItem(10L, 5L, exceedDay, currentUser))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("31. Reorder với orderIndex quá sát item khác -> kích hoạt rebalanceWithItem")
    void reorder_directOrderIndex_tooClose_triggersRebalance() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem item1 = ItineraryItem.builder().itemId(1L).dayNumber(1).positionIndex(1.0).build();
        ItineraryItem item2 = ItineraryItem.builder().itemId(2L).dayNumber(1).positionIndex(2.0).build();
        ItineraryItem itemToMove = ItineraryItem.builder().itemId(5L).dayNumber(1).positionIndex(3.0).trip(trip).place(place).build();

        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(5L, 10L)).thenReturn(Optional.of(itemToMove));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(item1, item2, itemToMove));

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder()
                .orderIndex(2.00001)
                .build();

        ItineraryItemResponse response = itineraryService.reorderItineraryItem(10L, 5L, request, currentUser);

        assertThat(item1.getPositionIndex()).isEqualTo(1.0);
        assertThat(item2.getPositionIndex()).isEqualTo(2.0);
        assertThat(response.getOrderIndex()).isEqualTo(3.0);
        verify(itineraryItemRepository, times(3)).save(any(ItineraryItem.class));
    }

    @Test
    @DisplayName("32. Reorder thất bại khi prevItemId hoặc nextItemId không tồn tại")
    void reorder_missingPrevOrNext_throwsEntityNotFoundException() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem item = ItineraryItem.builder().itemId(5L).dayNumber(1).positionIndex(1.0).trip(trip).place(place).build();
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(5L, 10L)).thenReturn(Optional.of(item));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 1))
                .thenReturn(List.of(item));

        when(itineraryItemRepository.findByItemIdAndTrip_TripId(888L, 10L)).thenReturn(Optional.empty());
        ReorderItineraryItemRequest badPrev = ReorderItineraryItemRequest.builder().prevItemId(888L).build();
        assertThatThrownBy(() -> itineraryService.reorderItineraryItem(10L, 5L, badPrev, currentUser))
                .isInstanceOf(EntityNotFoundException.class);

        when(itineraryItemRepository.findByItemIdAndTrip_TripId(1L, 10L))
                .thenReturn(Optional.of(ItineraryItem.builder().itemId(1L).positionIndex(1.0).build()));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(999L, 10L)).thenReturn(Optional.empty());
        ReorderItineraryItemRequest badNext = ReorderItineraryItemRequest.builder().prevItemId(1L).nextItemId(999L).build();
        assertThatThrownBy(() -> itineraryService.reorderItineraryItem(10L, 5L, badNext, currentUser))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("33. Reorder với prevItem và nextItem đều null -> gán 1.0 nếu ngày trống, rebalance nếu đã có item khác")
    void reorder_bothPrevAndNextNull_handlesEmptyAndNonEmptyDay() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem item = ItineraryItem.builder().itemId(5L).dayNumber(2).positionIndex(5.0).trip(trip).place(place).build();
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(5L, 10L)).thenReturn(Optional.of(item));
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 2))
                .thenReturn(List.of());

        ReorderItineraryItemRequest request = ReorderItineraryItemRequest.builder().build();
        ItineraryItemResponse emptyDayResp = itineraryService.reorderItineraryItem(10L, 5L, request, currentUser);
        assertThat(emptyDayResp.getOrderIndex()).isEqualTo(1.0);

        ItineraryItem existingOther = ItineraryItem.builder().itemId(6L).dayNumber(2).positionIndex(2.0).build();
        when(itineraryItemRepository.findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(10L, 2))
                .thenReturn(List.of(existingOther, item));

        ItineraryItemResponse nonEmptyDayResp = itineraryService.reorderItineraryItem(10L, 5L, request, currentUser);
        assertThat(nonEmptyDayResp.getOrderIndex()).isEqualTo(1.0);
        assertThat(existingOther.getPositionIndex()).isEqualTo(2.0);
    }

    @Test
    @DisplayName("34. Batch reorder kiểm tra đầy đủ validate đầu vào không hợp lệ (null, NaN, Infinite, trùng itemId, dayNumber < 1)")
    void reorderItinerary_invalidInputs_throwsIllegalArgumentException() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, null, currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, Collections.singletonList(null), currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        List<ReorderItemRequest> nullItemId = List.of(
                ReorderItemRequest.builder().itemId(null).dayNumber(1).orderIndex(1.0).build());
        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, nullItemId, currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        List<ReorderItemRequest> nullOrder = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(null).build());
        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, nullOrder, currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        List<ReorderItemRequest> nanOrder = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(Double.NaN).build());
        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, nanOrder, currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        List<ReorderItemRequest> infOrder = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(Double.POSITIVE_INFINITY).build());
        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, infOrder, currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        List<ReorderItemRequest> duplicateIds = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(1.0).build(),
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(2.0).build());
        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, duplicateIds, currentUser))
                .isInstanceOf(IllegalArgumentException.class);

        List<ReorderItemRequest> invalidDayZero = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(0).orderIndex(1.0).build());
        assertThatThrownBy(() -> itineraryService.reorderItinerary(10L, invalidDayZero, currentUser))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("35. Batch reorder chuyển item về danh sách chưa xếp ngày (dayNumber = null) và xử lý trùng positionIndex với item ngoài request")
    void reorderItinerary_unassignedDayAndMixedTieBreaking_success() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);

        ItineraryItem itemInReq = ItineraryItem.builder().itemId(1L).trip(trip).place(place).dayNumber(1).positionIndex(2.0).build();
        ItineraryItem itemNotInReqA = ItineraryItem.builder().itemId(2L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        ItineraryItem itemNotInReqB = ItineraryItem.builder().itemId(3L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        ItineraryItem itemToPool = ItineraryItem.builder().itemId(4L).trip(trip).place(place).dayNumber(1).positionIndex(3.0).build();

        when(itineraryItemRepository.findAllByTripIdWithPlace(10L))
                .thenReturn(Arrays.asList(itemInReq, itemNotInReqA, itemNotInReqB, itemToPool));

        List<ReorderItemRequest> requests = List.of(
                ReorderItemRequest.builder().itemId(1L).dayNumber(1).orderIndex(1.0).build(),
                ReorderItemRequest.builder().itemId(4L).dayNumber(null).orderIndex(1.0).build()
        );

        List<ItineraryItemResponse> result = itineraryService.reorderItinerary(10L, requests, currentUser);

        // Ngày 1: item 1 (nằm trong request, ưu tiên trước khi trùng positionIndex=1.0), sau đó item 2, item 3 (so sánh theo itemId)
        assertThat(itemInReq.getPositionIndex()).isEqualTo(1.0);
        assertThat(itemNotInReqA.getPositionIndex()).isEqualTo(2.0);
        assertThat(itemNotInReqB.getPositionIndex()).isEqualTo(3.0);
        assertThat(itemToPool.getDayNumber()).isNull();
        assertThat(result).hasSize(4);
        assertThat(result.get(3).getItemId()).isEqualTo(4L);
        assertThat(result.get(3).getDayNumber()).isNull();
    }

    @Test
    @DisplayName("36. COLLABORATOR đang ACTIVE được phép xem, thêm, sửa, sắp xếp và xóa lịch trình")
    void collaborator_canManageItinerary() {
        User collaborator = User.builder()
                .userId(2L)
                .email("collab@travel.com")
                .username("collabuser")
                .build();
        when(tripSecurityService.getTripIfMember(10L, collaborator)).thenReturn(trip);

        ItineraryItem item = ItineraryItem.builder()
                .itemId(1L).trip(trip).place(place).dayNumber(1).positionIndex(1.0).build();
        when(itineraryItemRepository.findAllByTripIdWithPlace(10L)).thenReturn(List.of(item));
        when(placeRepository.findById(100L)).thenReturn(Optional.of(place));
        when(itineraryItemRepository.findMaxPositionIndexByTripIdAndDayNumber(10L, 1)).thenReturn(Optional.of(1.0));
        when(itineraryItemRepository.save(any(ItineraryItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itineraryItemRepository.findByItemIdAndTripIdWithPlace(1L, 10L)).thenReturn(Optional.of(item));
        when(itineraryItemRepository.findByItemIdAndTrip_TripId(1L, 10L)).thenReturn(Optional.of(item));

        assertThat(itineraryService.getItinerary(10L, collaborator)).hasSize(1);

        CreateItineraryItemRequest addReq = CreateItineraryItemRequest.builder().placeId(100L).dayNumber(1).build();
        assertThat(itineraryService.addItineraryItem(10L, addReq, collaborator).getOrderIndex()).isEqualTo(2.0);

        UpdateItineraryItemRequest updateReq = UpdateItineraryItemRequest.builder().note("Collab note").build();
        assertThat(itineraryService.updateItineraryItem(10L, 1L, updateReq, collaborator).getNote()).isEqualTo("Collab note");

        itineraryService.deleteItineraryItem(10L, 1L, collaborator);
        verify(itineraryItemRepository).delete(item);
    }
}
