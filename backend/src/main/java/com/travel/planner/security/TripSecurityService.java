package com.travel.planner.security;

import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.TripMemberRepository;
import com.travel.planner.repository.TripRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Chức năng: Kiểm tra quyền sở hữu (Owner) và quyền thành viên (Member: OWNER hoặc COLLABORATOR đang ACTIVE)
 * chuyến đi dùng chung cho hệ thống.
 */
@Service("tripSecurityService")
@RequiredArgsConstructor
public class TripSecurityService {

    public static final String ROLE_OWNER = "OWNER";
    public static final String ROLE_COLLABORATOR = "COLLABORATOR";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_LEFT = "LEFT";
    private static final List<String> EDITABLE_ROLES = List.of(ROLE_OWNER, ROLE_COLLABORATOR);

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;

    // Kiểm tra user có phải owner của trip hay không (trả về true/false)
    @Transactional(readOnly = true)
    public boolean isOwner(Long tripId, Long userId) {
        if (tripId == null || userId == null) {
            return false;
        }
        return tripRepository.existsByTripIdAndOwner_UserId(tripId, userId);
    }

    // Kiểm tra user có phải owner hoặc thành viên (OWNER/COLLABORATOR) đang ACTIVE của trip hay không
    @Transactional(readOnly = true)
    public boolean isMember(Long tripId, Long userId) {
        if (tripId == null || userId == null) {
            return false;
        }
        return tripRepository.existsByTripIdAndOwner_UserId(tripId, userId)
                || tripMemberRepository.existsByTrip_TripIdAndUser_UserIdAndRoleInAndStatus(
                        tripId, userId, EDITABLE_ROLES, STATUS_ACTIVE);
    }

    // Kiểm tra user có phải COLLABORATOR đang ACTIVE của trip hay không
    @Transactional(readOnly = true)
    public boolean isActiveCollaborator(Long tripId, Long userId) {
        if (tripId == null || userId == null) {
            return false;
        }
        return tripMemberRepository.existsByTrip_TripIdAndUser_UserIdAndRoleAndStatus(
                tripId, userId, ROLE_COLLABORATOR, STATUS_ACTIVE);
    }

    // Kiểm tra user có quyền chỉnh sửa nội dung chuyến đi (Itinerary, Budget, Checklist) hay không
    @Transactional(readOnly = true)
    public boolean canEditTripContent(Long tripId, Long userId) {
        return isMember(tripId, userId);
    }

    // Lấy trip nếu user là owner, quăng lỗi 404 nếu không tìm thấy hoặc 403 nếu không có quyền
    @Transactional(readOnly = true)
    public Trip getTripIfOwner(Long tripId, User currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new AccessDeniedException("Bạn cần đăng nhập để thực hiện thao tác này.");
        }
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        if (!trip.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác.");
        }
        return trip;
    }

    // Lấy trip nếu user là OWNER hoặc COLLABORATOR đang ACTIVE (status = 'ACTIVE'), quăng lỗi 404 hoặc 403
    @Transactional(readOnly = true)
    public Trip getTripIfMember(Long tripId, User currentUser) {
        if (currentUser == null || currentUser.getUserId() == null) {
            throw new AccessDeniedException("Bạn cần đăng nhập để thực hiện thao tác này.");
        }
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        boolean isOwner = trip.getOwner().getUserId().equals(currentUser.getUserId());
        if (isOwner) {
            return trip;
        }

        boolean isEditableActiveMember = tripMemberRepository.existsByTrip_TripIdAndUser_UserIdAndRoleInAndStatus(
                tripId, currentUser.getUserId(), EDITABLE_ROLES, STATUS_ACTIVE);

        if (!isEditableActiveMember) {
            throw new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi này.");
        }
        return trip;
    }

    // Alias tường minh cho quyền chỉnh sửa nội dung chuyến đi (OWNER hoặc COLLABORATOR ACTIVE)
    @Transactional(readOnly = true)
    public Trip getTripIfCanEdit(Long tripId, User currentUser) {
        return getTripIfMember(tripId, currentUser);
    }
}
