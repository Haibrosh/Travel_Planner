package com.travel.planner.service;

import com.travel.planner.dto.CollaboratorResponse;
import com.travel.planner.dto.InviteLinkResponse;
import com.travel.planner.dto.JoinTripResponse;
import com.travel.planner.model.Destination;
import com.travel.planner.model.Trip;
import com.travel.planner.model.TripMember;
import com.travel.planner.model.TripMemberId;
import com.travel.planner.model.User;
import com.travel.planner.repository.TripMemberRepository;
import com.travel.planner.repository.TripRepository;
import com.travel.planner.security.InviteTokenService;
import com.travel.planner.security.TripSecurityService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripCollaboratorServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private TripSecurityService tripSecurityService;

    @Mock
    private InviteTokenService inviteTokenService;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private TripCollaboratorService tripCollaboratorService;

    private User owner;
    private User collaborator;
    private User outsider;
    private Trip trip;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(tripCollaboratorService, "frontendUrl", "https://travelsync.vn/");

        owner = User.builder()
                .userId(1L)
                .username("owneruser")
                .email("owner@travel.com")
                .build();
        collaborator = User.builder()
                .userId(2L)
                .username("collabuser")
                .email("collab@travel.com")
                .build();
        outsider = User.builder()
                .userId(3L)
                .username("outsider")
                .email("outsider@travel.com")
                .build();

        Destination destination = Destination.builder()
                .provinceCode("48")
                .slug("da_nang")
                .name("Đà Nẵng")
                .build();

        trip = Trip.builder()
                .tripId(10L)
                .owner(owner)
                .destination(destination)
                .name("Du lịch Đà Nẵng")
                .startDate(LocalDate.of(2026, 12, 1))
                .endDate(LocalDate.of(2026, 12, 4))
                .status("PLANNING")
                .createdAt(LocalDateTime.of(2026, 11, 20, 10, 0))
                .build();
    }

    @Test
    @DisplayName("1. OWNER tạo link mời thành công với mặc định role COLLABORATOR")
    void createInviteLink_owner_success() {
        when(tripSecurityService.getTripIfOwner(10L, owner)).thenReturn(trip);
        when(inviteTokenService.generateInviteToken(10L, "COLLABORATOR")).thenReturn("jwt.invite.token");

        InviteLinkResponse response = tripCollaboratorService.createInviteLink(10L, null, owner);

        assertThat(response.getTripId()).isEqualTo(10L);
        assertThat(response.getToken()).isEqualTo("jwt.invite.token");
        assertThat(response.getInviteLink()).isEqualTo("https://travelsync.vn/trips/join?token=jwt.invite.token");
        assertThat(response.getRole()).isEqualTo("COLLABORATOR");
        assertThat(response.getExpiresInSeconds()).isEqualTo(7L * 24 * 60 * 60);
        assertThat(response.getExpiresAt()).isNotNull();
    }

    @Test
    @DisplayName("2. Non-owner không thể tạo link mời -> ném AccessDeniedException")
    void createInviteLink_nonOwner_throwsAccessDenied() {
        when(tripSecurityService.getTripIfOwner(10L, collaborator))
                .thenThrow(new AccessDeniedException("Không có quyền."));

        assertThatThrownBy(() -> tripCollaboratorService.createInviteLink(10L, null, collaborator))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(inviteTokenService);
    }

    @Test
    @DisplayName("3. Tham gia chuyến đi bằng token hợp lệ -> thêm mới vào app.trip_members (COLLABORATOR, ACTIVE)")
    void joinTripByToken_newMember_success() {
        when(inviteTokenService.decodeInviteToken("valid-jwt"))
                .thenReturn(new InviteTokenService.InviteClaims(10L, "COLLABORATOR"));
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.empty());
        when(tripMemberRepository.saveAndFlush(any(TripMember.class))).thenAnswer(inv -> inv.getArgument(0));

        JoinTripResponse response = tripCollaboratorService.joinTripByToken("valid-jwt", collaborator);

        assertThat(response.getTripId()).isEqualTo(10L);
        assertThat(response.getUserId()).isEqualTo(2L);
        assertThat(response.getRole()).isEqualTo("COLLABORATOR");
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
        assertThat(response.getAlreadyMember()).isFalse();
        verify(tripMemberRepository).insertOwnerIfMissingIgnoreConflict(10L, 1L);
        verify(tripMemberRepository).saveAndFlush(argThat(m ->
                m.getId().equals(new TripMemberId(10L, 2L))
                        && "COLLABORATOR".equals(m.getRole())
                        && "ACTIVE".equals(m.getStatus())));
        verify(entityManager).refresh(any(TripMember.class));
    }

    @Test
    @DisplayName("4. Thành viên từng LEFT tham gia lại -> kích hoạt status = ACTIVE")
    void joinTripByToken_leftMember_reactivates() {
        TripMember leftMember = TripMember.builder()
                .id(new TripMemberId(10L, 2L))
                .trip(trip)
                .user(collaborator)
                .role("COLLABORATOR")
                .status("LEFT")
                .joinedAt(LocalDateTime.of(2026, 11, 21, 9, 0))
                .build();

        when(inviteTokenService.decodeInviteToken("valid-jwt"))
                .thenReturn(new InviteTokenService.InviteClaims(10L, "COLLABORATOR"));
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.of(leftMember));
        when(tripMemberRepository.saveAndFlush(leftMember)).thenReturn(leftMember);

        JoinTripResponse response = tripCollaboratorService.joinTripByToken("valid-jwt", collaborator);

        assertThat(response.getStatus()).isEqualTo("ACTIVE");
        assertThat(response.getAlreadyMember()).isFalse();
        assertThat(leftMember.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("5. Thành viên đã ACTIVE hoặc OWNER mở lại link mời -> idempotent alreadyMember = true")
    void joinTripByToken_alreadyActiveOrOwner_idempotent() {
        TripMember activeMember = TripMember.builder()
                .id(new TripMemberId(10L, 2L))
                .trip(trip)
                .user(collaborator)
                .role("COLLABORATOR")
                .status("ACTIVE")
                .joinedAt(LocalDateTime.of(2026, 11, 21, 9, 0))
                .build();

        when(inviteTokenService.decodeInviteToken("valid-jwt"))
                .thenReturn(new InviteTokenService.InviteClaims(10L, "COLLABORATOR"));
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.of(activeMember));

        JoinTripResponse memberRes = tripCollaboratorService.joinTripByToken("valid-jwt", collaborator);
        assertThat(memberRes.getAlreadyMember()).isTrue();
        assertThat(memberRes.getRole()).isEqualTo("COLLABORATOR");

        JoinTripResponse ownerRes = tripCollaboratorService.joinTripByToken("valid-jwt", owner);
        assertThat(ownerRes.getAlreadyMember()).isTrue();
        assertThat(ownerRes.getRole()).isEqualTo("OWNER");
        verify(tripMemberRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("6. Token hết hạn, sai chữ ký, hoặc rỗng -> ném IllegalArgumentException (400)")
    void joinTripByToken_invalidTokens_throwsIllegalArgument() {
        assertThatThrownBy(() -> tripCollaboratorService.joinTripByToken("  ", collaborator))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("token");

        when(inviteTokenService.decodeInviteToken("expired"))
                .thenThrow(new ExpiredJwtException(null, null, "expired"));
        assertThatThrownBy(() -> tripCollaboratorService.joinTripByToken("expired", collaborator))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hết hạn");

        when(inviteTokenService.decodeInviteToken("tampered"))
                .thenThrow(new JwtException("bad sig"));
        assertThatThrownBy(() -> tripCollaboratorService.joinTripByToken("tampered", collaborator))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    @DisplayName("7. Lấy danh sách thành viên ACTIVE (tổng hợp cả OWNER cho trip cũ trước V6)")
    void getCollaborators_synthesizesMissingOwnerAndSortsOwnerFirst() {
        TripMember collabMember = TripMember.builder()
                .id(new TripMemberId(10L, 2L))
                .trip(trip)
                .user(collaborator)
                .role("COLLABORATOR")
                .status("ACTIVE")
                .joinedAt(LocalDateTime.of(2026, 11, 21, 9, 0))
                .build();

        when(tripSecurityService.getTripIfMember(10L, collaborator)).thenReturn(trip);
        when(tripMemberRepository.findByTripIdAndStatusWithUser(10L, "ACTIVE")).thenReturn(List.of(collabMember));

        List<CollaboratorResponse> result = tripCollaboratorService.getCollaborators(10L, collaborator);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUserId()).isEqualTo(1L);
        assertThat(result.get(0).getRole()).isEqualTo("OWNER");
        assertThat(result.get(0).getIsOwner()).isTrue();
        assertThat(result.get(1).getUserId()).isEqualTo(2L);
        assertThat(result.get(1).getRole()).isEqualTo("COLLABORATOR");
        assertThat(result.get(1).getIsOwner()).isFalse();
    }

    @Test
    @DisplayName("8. OWNER xóa thành viên hoặc COLLABORATOR tự rời nhóm -> soft-remove status = LEFT")
    void removeCollaborator_ownerAndSelfLeave_setsStatusLeft() {
        TripMember activeMember = TripMember.builder()
                .id(new TripMemberId(10L, 2L))
                .trip(trip)
                .user(collaborator)
                .role("COLLABORATOR")
                .status("ACTIVE")
                .build();

        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 2L)).thenReturn(Optional.of(activeMember));
        when(tripMemberRepository.saveAndFlush(activeMember)).thenReturn(activeMember);

        tripCollaboratorService.removeCollaborator(10L, 2L, owner);
        assertThat(activeMember.getStatus()).isEqualTo("LEFT");
        verify(tripMemberRepository, never()).delete(any());

        activeMember.setStatus("ACTIVE");
        when(tripSecurityService.isActiveCollaborator(10L, 2L)).thenReturn(true);
        tripCollaboratorService.removeCollaborator(10L, 2L, collaborator);
        assertThat(activeMember.getStatus()).isEqualTo("LEFT");
    }

    @Test
    @DisplayName("9. Bảo vệ quyền xóa thành viên: chặn xóa OWNER, chặn COLLABORATOR xóa người khác, 404 khi không tìm thấy")
    void removeCollaborator_authorizationAndValidation() {
        when(tripRepository.findByIdWithDetails(10L)).thenReturn(Optional.of(trip));

        // Collaborator cố xóa user khác (id=3) -> 403
        assertThatThrownBy(() -> tripCollaboratorService.removeCollaborator(10L, 3L, collaborator))
                .isInstanceOf(AccessDeniedException.class);

        // Outsider cố xóa -> 403
        assertThatThrownBy(() -> tripCollaboratorService.removeCollaborator(10L, 2L, outsider))
                .isInstanceOf(AccessDeniedException.class);

        // Không thể xóa OWNER -> 400
        assertThatThrownBy(() -> tripCollaboratorService.removeCollaborator(10L, 1L, owner))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("OWNER");

        // Thành viên không tồn tại hoặc đã LEFT -> 404
        when(tripMemberRepository.findByTripIdAndUserIdWithUser(10L, 3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> tripCollaboratorService.removeCollaborator(10L, 3L, owner))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
