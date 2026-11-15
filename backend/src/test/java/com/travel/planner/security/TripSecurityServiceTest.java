package com.travel.planner.security;

import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.TripMemberRepository;
import com.travel.planner.repository.TripRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripSecurityServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @InjectMocks
    private TripSecurityService tripSecurityService;

    private User owner;
    private User collaborator;
    private User outsider;
    private Trip trip;

    @BeforeEach
    void setUp() {
        owner = User.builder().userId(1L).username("owner").email("owner@test.com").build();
        collaborator = User.builder().userId(2L).username("collab").email("collab@test.com").build();
        outsider = User.builder().userId(3L).username("outsider").email("outsider@test.com").build();

        trip = Trip.builder()
                .tripId(10L)
                .owner(owner)
                .name("Chuyến đi Đà Lạt")
                .build();
    }

    @Test
    @DisplayName("1. getTripIfMember cho phép owner truy cập")
    void getTripIfMember_owner_success() {
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.existsByTrip_TripIdAndUser_UserIdAndStatus(10L, 1L, "ACTIVE")).thenReturn(false);

        Trip result = tripSecurityService.getTripIfMember(10L, owner);

        assertThat(result).isSameAs(trip);
    }

    @Test
    @DisplayName("2. getTripIfMember cho phép thành viên ACTIVE truy cập")
    void getTripIfMember_activeMember_success() {
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.existsByTrip_TripIdAndUser_UserIdAndStatus(10L, 2L, "ACTIVE")).thenReturn(true);

        Trip result = tripSecurityService.getTripIfMember(10L, collaborator);

        assertThat(result).isSameAs(trip);
    }

    @Test
    @DisplayName("3. getTripIfMember chặn người ngoài hoặc thành viên đã LEFT")
    void getTripIfMember_outsider_throwsAccessDenied() {
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.existsByTrip_TripIdAndUser_UserIdAndStatus(10L, 3L, "ACTIVE")).thenReturn(false);

        assertThatThrownBy(() -> tripSecurityService.getTripIfMember(10L, outsider))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("4. getTripIfMember ném EntityNotFoundException khi trip không tồn tại")
    void getTripIfMember_notFound_throwsEntityNotFound() {
        when(tripRepository.findByIdWithDetails(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tripSecurityService.getTripIfMember(99L, owner))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
