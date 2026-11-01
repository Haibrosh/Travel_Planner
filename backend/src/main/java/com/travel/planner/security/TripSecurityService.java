package com.travel.planner.security;

import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.TripRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Chức năng: Kiểm tra quyền sở hữu chuyến đi (Owner) dùng chung cho hệ thống.
 */
@Service("tripSecurityService")
@RequiredArgsConstructor
public class TripSecurityService {

    private final TripRepository tripRepository;

    // Kiểm tra user có phải owner của trip hay không (trả về true/false)
    @Transactional(readOnly = true)
    public boolean isOwner(Long tripId, Long userId) {
        if (tripId == null || userId == null) {
            return false;
        }
        return tripRepository.existsByTripIdAndOwner_UserId(tripId, userId);
    }

    // Lấy trip nếu user là owner, quăng lỗi 404 nếu không tìm thấy hoặc 403 nếu không có quyền
    @Transactional(readOnly = true)
    public Trip getTripIfOwner(Long tripId, User currentUser) {
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        if (!trip.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác.");
        }
        return trip;
    }
}
