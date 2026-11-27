package com.travel.planner.service;

import com.travel.planner.dto.ChecklistItemRequest;
import com.travel.planner.dto.ChecklistItemResponse;
import com.travel.planner.model.ChecklistItem;
import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.ChecklistItemRepository;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChecklistServiceTest {

    @Mock
    private ChecklistItemRepository checklistItemRepository;

    @Mock
    private TripSecurityService tripSecurityService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private ChecklistService checklistService;

    private User currentUser;
    private Trip trip;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .userId(1L)
                .email("test@travel.com")
                .username("testuser")
                .build();

        trip = Trip.builder()
                .tripId(10L)
                .owner(currentUser)
                .name("Chuyến đi Phú Quốc")
                .build();
    }

    @Test
    @DisplayName("1. Lấy danh sách hành lý thành công")
    void getChecklistItems_success() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        ChecklistItem item1 = ChecklistItem.builder()
                .itemId(1L).trip(trip).name("CCCD").category("Giấy tờ").isCompleted(true).build();
        ChecklistItem item2 = ChecklistItem.builder()
                .itemId(2L).trip(trip).name("Sạc dự phòng").category("Công nghệ").isCompleted(false).build();

        when(checklistItemRepository.findByTrip_TripIdOrderByItemIdAsc(10L)).thenReturn(List.of(item1, item2));

        List<ChecklistItemResponse> result = checklistService.getChecklistItems(10L, currentUser);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("CCCD");
        assertThat(result.get(0).getIsCompleted()).isTrue();
        assertThat(result.get(1).getIsCompleted()).isFalse();
    }

    @Test
    @DisplayName("2. Tạo mới hành lý thành công với giá trị mặc định cho category và isCompleted")
    void createChecklistItem_defaults_success() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        when(checklistItemRepository.saveAndFlush(any(ChecklistItem.class))).thenAnswer(invocation -> {
            ChecklistItem saved = invocation.getArgument(0);
            saved.setItemId(5L);
            return saved;
        });

        ChecklistItemRequest request = ChecklistItemRequest.builder()
                .name("  Kem chống nắng  ")
                .build();

        ChecklistItemResponse response = checklistService.createChecklistItem(10L, request, currentUser);

        assertThat(response.getItemId()).isEqualTo(5L);
        assertThat(response.getTripId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("Kem chống nắng");
        assertThat(response.getCategory()).isEqualTo("Cá nhân");
        assertThat(response.getIsCompleted()).isFalse();
    }

    @Test
    @DisplayName("3. Cập nhật thông tin hành lý thành công")
    void updateChecklistItem_success() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        ChecklistItem existing = ChecklistItem.builder()
                .itemId(5L).trip(trip).name("Áo khoác").category("Trang phục").isCompleted(false).build();

        when(checklistItemRepository.findByItemIdAndTrip_TripId(5L, 10L)).thenReturn(Optional.of(existing));
        when(checklistItemRepository.saveAndFlush(any(ChecklistItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ChecklistItemRequest request = ChecklistItemRequest.builder()
                .name("Áo gió chống nước")
                .category("Trang phục")
                .isCompleted(true)
                .build();

        ChecklistItemResponse updated = checklistService.updateChecklistItem(10L, 5L, request, currentUser);

        assertThat(updated.getName()).isEqualTo("Áo gió chống nước");
        assertThat(updated.getIsCompleted()).isTrue();
    }

    @Test
    @DisplayName("4. Đảo trạng thái isCompleted thành công (false -> true -> false)")
    void toggleChecklistItem_flipsState() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        ChecklistItem existing = ChecklistItem.builder()
                .itemId(5L).trip(trip).name("Hộ chiếu").category("Giấy tờ").isCompleted(false).build();

        when(checklistItemRepository.findByItemIdAndTrip_TripId(5L, 10L)).thenReturn(Optional.of(existing));
        when(checklistItemRepository.saveAndFlush(any(ChecklistItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ChecklistItemResponse firstToggle = checklistService.toggleChecklistItem(10L, 5L, currentUser);
        assertThat(firstToggle.getIsCompleted()).isTrue();

        ChecklistItemResponse secondToggle = checklistService.toggleChecklistItem(10L, 5L, currentUser);
        assertThat(secondToggle.getIsCompleted()).isFalse();
    }

    @Test
    @DisplayName("5. Xóa mục hành lý thành công")
    void deleteChecklistItem_success() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        ChecklistItem existing = ChecklistItem.builder().itemId(5L).trip(trip).name("Ô dù").build();
        when(checklistItemRepository.findByItemIdAndTrip_TripId(5L, 10L)).thenReturn(Optional.of(existing));

        checklistService.deleteChecklistItem(10L, 5L, currentUser);

        verify(checklistItemRepository, times(1)).delete(existing);
    }

    @Test
    @DisplayName("6. Không tìm thấy mục hành lý thuộc trip -> ném EntityNotFoundException")
    void toggleChecklistItem_notFound_throwsEntityNotFound() {
        when(tripSecurityService.getTripIfMember(10L, currentUser)).thenReturn(trip);
        when(checklistItemRepository.findByItemIdAndTrip_TripId(99L, 10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> checklistService.toggleChecklistItem(10L, 99L, currentUser))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("7. Người không có quyền truy cập trip -> ném AccessDeniedException")
    void getChecklistItems_forbidden_throwsAccessDenied() {
        when(tripSecurityService.getTripIfMember(10L, currentUser))
                .thenThrow(new AccessDeniedException("Không có quyền"));

        assertThatThrownBy(() -> checklistService.getChecklistItems(10L, currentUser))
                .isInstanceOf(AccessDeniedException.class);
    }
}
