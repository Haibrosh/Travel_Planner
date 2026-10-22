package com.travel.planner.service;

import com.travel.planner.dto.TripRequest;
import com.travel.planner.dto.TripResponse;
import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.TripRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Chức năng: Xử lý toàn bộ nghiệp vụ CRUD Chuyến đi (Trip) và kiểm tra quyền sở hữu của người dùng hiện tại.
 */
@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final EntityManager entityManager;

    // Hàm đặc biệt: Tạo chuyến đi mới cho user đang đăng nhập.
    // Lưu ý: Trigger 'trg_add_trip_owner_as_member' trong DB (V6) sẽ tự động thêm chủ chuyến đi vào bảng 'app.trip_members' với role 'OWNER'.
    @Transactional
    public TripResponse createTrip(TripRequest request, User currentUser) {
        // Kiểm tra ràng buộc ngày tháng khớp với constraint chk_trips_dates (end_date >= start_date)
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        }

        // Kiểm tra điểm đến có tồn tại trong bảng analytics.destinations không (tránh lỗi FK trả về 500)
        if (!tripRepository.existsDestinationById(request.getDestinationId())) {
            throw new EntityNotFoundException("Không tìm thấy điểm đến với ID: " + request.getDestinationId());
        }

        Trip trip = Trip.builder()
                .owner(currentUser)
                .destinationId(request.getDestinationId())
                .name(request.getName().trim())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status("PLANNING")
                .build();

        Trip savedTrip = tripRepository.saveAndFlush(trip);
        // Đọc lại từ DB để lấy created_at/updated_at do DB tự sinh (nếu không sẽ trả về null)
        entityManager.refresh(savedTrip);
        return TripResponse.fromEntity(savedTrip);
    }

    // Hàm đặc biệt: Lấy danh sách các chuyến đi của chính user đang đăng nhập (mới tạo nhất xếp trước)
    @Transactional(readOnly = true)
    public List<TripResponse> getMyTrips(User currentUser) {
        return tripRepository.findAllByOwnerIdWithDetails(currentUser.getUserId())
                .stream()
                .map(TripResponse::fromEntity)
                .toList();
    }

    // Hàm đặc biệt: Xem chi tiết 1 chuyến đi theo ID, có kiểm tra quyền chỉ chủ sở hữu mới được xem
    @Transactional(readOnly = true)
    public TripResponse getTripById(Long tripId, User currentUser) {
        Trip trip = getTripAndVerifyOwner(tripId, currentUser);
        return TripResponse.fromEntity(trip);
    }

    // Hàm đặc biệt: Xóa chuyến đi theo ID, chỉ chủ sở hữu mới có quyền xóa
    @Transactional
    public void deleteTrip(Long tripId, User currentUser) {
        Trip trip = getTripAndVerifyOwner(tripId, currentUser);
        tripRepository.delete(trip);
    }

    // Hàm nội bộ: Tìm Trip theo ID và kiểm tra nghiêm ngặt quyền sở hữu (owner_id == currentUser.userId)
    private Trip getTripAndVerifyOwner(Long tripId, User currentUser) {
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        if (!trip.getOwner().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền xem hoặc thao tác trên chuyến đi của người khác.");
        }

        return trip;
    }
}
