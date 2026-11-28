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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Chức năng: Xử lý các nghiệp vụ quản lý chuyến đi (Tạo, Xem, Cập nhật, Xóa).
 */
@Service
@RequiredArgsConstructor
public class TripService {

    private static final BigDecimal MAX_BUDGET = new BigDecimal("999999999999999");

    private final TripRepository tripRepository;
    private final DestinationRepository destinationRepository;
    private final ItineraryItemRepository itineraryItemRepository;
    private final TripSecurityService tripSecurityService;
    private final EntityManager entityManager;

    // Tạo chuyến đi mới cho user đang đăng nhập
    @Transactional
    public TripResponse createTrip(TripRequest request, User currentUser) {
        validateDateRange(request.getStartDate(), request.getEndDate());
        Destination destination = validateAndGetDestination(request.getProvinceCode());

        Trip trip = Trip.builder()
                .owner(currentUser)
                .destination(destination)
                .name(request.getName().trim())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budget(normalizeBudget(request.getBudget()))
                .status("PLANNING")
                .build();

        Trip savedTrip = tripRepository.saveAndFlush(trip);
        entityManager.refresh(savedTrip);
        return TripResponse.fromEntity(savedTrip);
    }

    // Lấy danh sách tất cả chuyến đi mà user là chủ sở hữu hoặc thành viên đang ACTIVE
    @Transactional(readOnly = true)
    public List<TripResponse> getMyTrips(User currentUser) {
        return tripRepository.findAllAccessibleByUserWithDetails(currentUser.getUserId())
                .stream()
                .map(TripResponse::fromEntity)
                .toList();
    }

    // Xem thông tin chi tiết một chuyến đi (OWNER hoặc COLLABORATOR đang ACTIVE)
    @Transactional(readOnly = true)
    public TripResponse getTripById(Long tripId, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);
        return TripResponse.fromEntity(trip);
    }

    // Cập nhật thông tin chuyến đi và tự động điều chỉnh lịch trình nếu thay đổi ngày
    @Transactional
    public TripResponse updateTrip(Long tripId, TripRequest request, User currentUser) {
        Trip trip = tripSecurityService.getTripIfOwner(tripId, currentUser);

        validateDateRange(request.getStartDate(), request.getEndDate());

        if (!request.getProvinceCode().equals(trip.getDestination().getProvinceCode())) {
            Destination destination = validateAndGetDestination(request.getProvinceCode());
            trip.setDestination(destination);
        }

        boolean datesChanged = !request.getStartDate().equals(trip.getStartDate())
                || !request.getEndDate().equals(trip.getEndDate());

        trip.setName(request.getName().trim());
        trip.setDescription(request.getDescription());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        if (request.getBudget() != null) {
            trip.setBudget(normalizeBudget(request.getBudget()));
        }
        tripRepository.saveAndFlush(trip);

        if (datesChanged) {
            adjustItineraryToDateRange(tripId, request.getStartDate(), request.getEndDate());
        }

        Trip updated = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));
        return TripResponse.fromEntity(updated);
    }

    // Xóa chuyến đi (chỉ chủ sở hữu mới có quyền xóa)
    @Transactional
    public void deleteTrip(Long tripId, User currentUser) {
        Trip trip = tripSecurityService.getTripIfOwner(tripId, currentUser);
        tripRepository.delete(trip);
    }

    // Tự động chuyển các địa điểm vượt quá số ngày mới về danh sách chưa xếp ngày
    private void adjustItineraryToDateRange(Long tripId, LocalDate startDate, LocalDate endDate) {
        int totalDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        itineraryItemRepository.unassignItemsExceedingMaxDays(tripId, totalDays);
    }

    // Kiểm tra tính hợp lệ của khoảng thời gian (ngày kết thúc phải >= ngày bắt đầu)
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        }
    }

    // Kiểm tra và lấy thông tin điểm đến theo mã tỉnh
    private Destination validateAndGetDestination(String provinceCode) {
        return destinationRepository.findById(provinceCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy điểm đến với mã tỉnh: " + provinceCode));
    }

    // Chuẩn hóa ngân sách dự kiến (NUMERIC(15, 0), >= 0, cho phép null nếu chưa thiết lập)
    public static BigDecimal normalizeBudget(BigDecimal rawBudget) {
        if (rawBudget == null) {
            return null;
        }
        // Kiểm tra cận trên/dưới trước khi stripTrailingZeros/setScale để tránh tràn bộ nhớ với số ký hiệu khoa học lớn
        if (rawBudget.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Ngân sách dự kiến không được âm.");
        }
        if (rawBudget.compareTo(MAX_BUDGET) > 0) {
            throw new IllegalArgumentException("Ngân sách dự kiến vượt quá giới hạn cho phép (tối đa 15 chữ số).");
        }
        if (rawBudget.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (rawBudget.compareTo(BigDecimal.ONE) < 0) {
            throw new IllegalArgumentException("Ngân sách dự kiến phải là số nguyên không âm (không có phần thập phân).");
        }
        BigDecimal normalized = rawBudget.stripTrailingZeros();
        if (normalized.scale() > 0) {
            throw new IllegalArgumentException("Ngân sách dự kiến phải là số nguyên không âm (không có phần thập phân).");
        }
        return normalized.setScale(0);
    }
}
