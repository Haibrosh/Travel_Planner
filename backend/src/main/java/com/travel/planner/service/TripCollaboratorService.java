package com.travel.planner.service;

import com.travel.planner.dto.CollaboratorResponse;
import com.travel.planner.dto.InviteLinkResponse;
import com.travel.planner.dto.JoinTripResponse;
import com.travel.planner.dto.TripResponse;
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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Chức năng: Quản lý thành viên & lời mời cộng tác chuyến đi (bảng app.trip_members theo migration V6).
 */
@Service
@RequiredArgsConstructor
public class TripCollaboratorService {

    private static final String DEFAULT_FRONTEND_URL = "http://localhost:3000";

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final TripSecurityService tripSecurityService;
    private final InviteTokenService inviteTokenService;
    private final EntityManager entityManager;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl = DEFAULT_FRONTEND_URL;

    // Chủ chuyến đi (OWNER) tạo link mời chứa JWT có hạn 7 ngày
    @Transactional(readOnly = true)
    public InviteLinkResponse createInviteLink(Long tripId, String requestedRole, User currentUser) {
        tripSecurityService.getTripIfOwner(tripId, currentUser);

        String inviteRole = (requestedRole == null || requestedRole.isBlank())
                ? TripSecurityService.ROLE_COLLABORATOR
                : requestedRole.trim().toUpperCase(Locale.ROOT);

        String token = inviteTokenService.generateInviteToken(tripId, inviteRole);
        String inviteLink = normalizeBaseUrl(frontendUrl)
                + "/trips/join?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);

        return InviteLinkResponse.builder()
                .tripId(tripId)
                .token(token)
                .inviteLink(inviteLink)
                .role(inviteRole)
                .expiresInSeconds(InviteTokenService.INVITE_TOKEN_EXPIRATION_SECONDS)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
    }

    // Xác thực JWT mời và thêm user hiện tại vào bảng app.trip_members với vai trò COLLABORATOR (status = ACTIVE)
    @Transactional
    public JoinTripResponse joinTripByToken(String rawToken, User currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new AccessDeniedException("Bạn cần đăng nhập để tham gia chuyến đi.");
        }
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Thiếu tham số bắt buộc: token");
        }

        InviteTokenService.InviteClaims claims = parseInviteTokenSafely(rawToken.trim());

        Trip trip = tripRepository.findByIdWithDetails(claims.tripId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chuyến đi với ID: " + claims.tripId()));

        // Bảo đảm chủ chuyến đi luôn có bản ghi OWNER trong app.trip_members (hỗ trợ trip cũ trước V6)
        tripMemberRepository.insertOwnerIfMissingIgnoreConflict(trip.getTripId(), trip.getOwner().getUserId());

        if (trip.getOwner().getUserId().equals(currentUser.getUserId())) {
            return buildJoinResponse(
                    trip,
                    currentUser,
                    TripSecurityService.ROLE_OWNER,
                    TripSecurityService.STATUS_ACTIVE,
                    true,
                    trip.getCreatedAt(),
                    "Bạn đã là chủ sở hữu của chuyến đi này."
            );
        }

        TripMember existing = tripMemberRepository
                .findByTripIdAndUserIdWithUser(trip.getTripId(), currentUser.getUserId())
                .orElse(null);

        if (existing != null) {
            if (TripSecurityService.STATUS_ACTIVE.equals(existing.getStatus())) {
                return buildJoinResponse(
                        trip,
                        currentUser,
                        existing.getRole(),
                        existing.getStatus(),
                        true,
                        existing.getJoinedAt(),
                        "Bạn đã là thành viên của chuyến đi này."
                );
            }

            // Thành viên từng rời/bị xóa (status = 'LEFT') tham gia lại -> kích hoạt lại bản ghi
            existing.setRole(TripSecurityService.ROLE_COLLABORATOR);
            existing.setStatus(TripSecurityService.STATUS_ACTIVE);
            existing.setJoinedAt(LocalDateTime.now());
            TripMember reactivated = tripMemberRepository.saveAndFlush(existing);
            return buildJoinResponse(
                    trip,
                    currentUser,
                    reactivated.getRole(),
                    reactivated.getStatus(),
                    false,
                    reactivated.getJoinedAt(),
                    "Tham gia chuyến đi thành công."
            );
        }

        TripMember newMember = TripMember.builder()
                .id(new TripMemberId(trip.getTripId(), currentUser.getUserId()))
                .trip(trip)
                .user(currentUser)
                .role(TripSecurityService.ROLE_COLLABORATOR)
                .status(TripSecurityService.STATUS_ACTIVE)
                .build();

        TripMember saved = tripMemberRepository.saveAndFlush(newMember);
        entityManager.refresh(saved);

        LocalDateTime joinedAt = saved.getJoinedAt() != null ? saved.getJoinedAt() : LocalDateTime.now();
        return buildJoinResponse(
                trip,
                currentUser,
                saved.getRole(),
                saved.getStatus(),
                false,
                joinedAt,
                "Tham gia chuyến đi thành công."
        );
    }

    // Lấy danh sách thành viên (OWNER + COLLABORATOR đang ACTIVE) của chuyến đi
    @Transactional(readOnly = true)
    public List<CollaboratorResponse> getCollaborators(Long tripId, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        List<TripMember> activeMembers = tripMemberRepository.findByTripIdAndStatusWithUser(
                tripId, TripSecurityService.STATUS_ACTIVE);

        List<CollaboratorResponse> responses = new ArrayList<>(activeMembers.size() + 1);
        boolean ownerPresent = false;
        Long ownerId = trip.getOwner().getUserId();

        for (TripMember member : activeMembers) {
            if (member.getUser().getUserId().equals(ownerId)) {
                ownerPresent = true;
            }
            responses.add(CollaboratorResponse.fromEntity(member));
        }

        if (!ownerPresent) {
            responses.add(CollaboratorResponse.fromOwner(trip));
        }

        responses.sort(Comparator
                .comparing((CollaboratorResponse r) -> !Boolean.TRUE.equals(r.getIsOwner()))
                .thenComparing(CollaboratorResponse::getJoinedAt, Comparator.nullsLast(LocalDateTime::compareTo))
                .thenComparing(CollaboratorResponse::getUserId, Comparator.nullsLast(Long::compareTo)));

        return responses;
    }

    // Xóa cộng tác viên khỏi chuyến đi (chuyển status = 'LEFT' để bảo toàn lịch sử chi tiêu theo FK V6)
    @Transactional
    public void removeCollaborator(Long tripId, Long targetUserId, User currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new AccessDeniedException("Bạn cần đăng nhập để thực hiện thao tác này.");
        }

        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        boolean callerIsOwner = trip.getOwner().getUserId().equals(currentUser.getUserId());
        boolean callerIsSelfActiveCollaborator = currentUser.getUserId().equals(targetUserId)
                && tripSecurityService.isActiveCollaborator(tripId, currentUser.getUserId());

        if (!callerIsOwner && !callerIsSelfActiveCollaborator) {
            throw new AccessDeniedException("Bạn không có quyền xóa thành viên khỏi chuyến đi này.");
        }

        if (trip.getOwner().getUserId().equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể xóa chủ sở hữu (OWNER) khỏi chuyến đi.");
        }

        TripMember member = tripMemberRepository.findByTripIdAndUserIdWithUser(tripId, targetUserId)
                .filter(m -> TripSecurityService.STATUS_ACTIVE.equals(m.getStatus()))
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy thành viên đang hoạt động với ID: " + targetUserId));

        if (TripSecurityService.ROLE_OWNER.equalsIgnoreCase(member.getRole())) {
            throw new IllegalArgumentException("Không thể xóa chủ sở hữu (OWNER) khỏi chuyến đi.");
        }

        member.setStatus(TripSecurityService.STATUS_LEFT);
        tripMemberRepository.saveAndFlush(member);
    }

    private InviteTokenService.InviteClaims parseInviteTokenSafely(String token) {
        try {
            return inviteTokenService.decodeInviteToken(token);
        } catch (ExpiredJwtException ex) {
            throw new IllegalArgumentException("Link mời tham gia chuyến đi đã hết hạn (quá 7 ngày).", ex);
        } catch (JwtException ex) {
            throw new IllegalArgumentException("Token lời mời không hợp lệ hoặc đã bị thay đổi.", ex);
        }
    }

    private JoinTripResponse buildJoinResponse(
            Trip trip,
            User user,
            String role,
            String status,
            boolean alreadyMember,
            LocalDateTime joinedAt,
            String message
    ) {
        return JoinTripResponse.builder()
                .tripId(trip.getTripId())
                .tripName(trip.getName())
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(role)
                .status(status)
                .alreadyMember(alreadyMember)
                .joinedAt(joinedAt)
                .message(message)
                .trip(TripResponse.fromEntity(trip))
                .build();
    }

    private String normalizeBaseUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return DEFAULT_FRONTEND_URL;
        }
        String trimmed = rawUrl.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed.isEmpty() ? DEFAULT_FRONTEND_URL : trimmed;
    }
}
