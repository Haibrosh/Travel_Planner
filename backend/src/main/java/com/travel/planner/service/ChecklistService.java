package com.travel.planner.service;

import com.travel.planner.dto.ChecklistItemRequest;
import com.travel.planner.dto.ChecklistItemResponse;
import com.travel.planner.model.ChecklistItem;
import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.ChecklistItemRepository;
import com.travel.planner.security.TripSecurityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Chức năng: Xử lý nghiệp vụ quản lý danh sách hành lý (Checklist) của chuyến đi.
 */
@Service
@RequiredArgsConstructor
public class ChecklistService {

    private static final String DEFAULT_CATEGORY = "Cá nhân";

    private final ChecklistItemRepository checklistItemRepository;
    private final TripSecurityService tripSecurityService;

    // Lấy toàn bộ danh sách món đồ hành lý của chuyến đi
    @Transactional(readOnly = true)
    public List<ChecklistItemResponse> getChecklistItems(Long tripId, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        return checklistItemRepository.findByTrip_TripIdOrderByItemIdAsc(tripId)
                .stream()
                .map(ChecklistItemResponse::fromEntity)
                .toList();
    }

    // Thêm món đồ hành lý mới vào chuyến đi
    @Transactional
    public ChecklistItemResponse createChecklistItem(Long tripId, ChecklistItemRequest request, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        ChecklistItem item = ChecklistItem.builder()
                .trip(trip)
                .name(request.getName().trim())
                .category(resolveCategory(request.getCategory()))
                .isCompleted(Boolean.TRUE.equals(request.getIsCompleted()))
                .build();

        ChecklistItem saved = checklistItemRepository.save(item);
        return ChecklistItemResponse.fromEntity(saved);
    }

    // Cập nhật thông tin món đồ hành lý
    @Transactional
    public ChecklistItemResponse updateChecklistItem(
            Long tripId,
            Long itemId,
            ChecklistItemRequest request,
            User currentUser
    ) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        ChecklistItem item = findItemInTrip(tripId, itemId);
        item.setName(request.getName().trim());
        if (request.getCategory() != null) {
            item.setCategory(resolveCategory(request.getCategory()));
        }
        if (request.getIsCompleted() != null) {
            item.setIsCompleted(request.getIsCompleted());
        }

        ChecklistItem updated = checklistItemRepository.save(item);
        return ChecklistItemResponse.fromEntity(updated);
    }

    // Đảo trạng thái hoàn thành (isCompleted) của một món đồ hành lý
    @Transactional
    public ChecklistItemResponse toggleChecklistItem(Long tripId, Long itemId, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        ChecklistItem item = findItemInTrip(tripId, itemId);
        item.setIsCompleted(!Boolean.TRUE.equals(item.getIsCompleted()));

        ChecklistItem updated = checklistItemRepository.save(item);
        return ChecklistItemResponse.fromEntity(updated);
    }

    // Xóa một món đồ hành lý khỏi chuyến đi
    @Transactional
    public void deleteChecklistItem(Long tripId, Long itemId, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        ChecklistItem item = findItemInTrip(tripId, itemId);
        checklistItemRepository.delete(item);
    }

    private ChecklistItem findItemInTrip(Long tripId, Long itemId) {
        return checklistItemRepository.findByItemIdAndTrip_TripId(itemId, tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy mục hành lý với ID: " + itemId));
    }

    private String resolveCategory(String rawCategory) {
        if (rawCategory == null || rawCategory.trim().isEmpty()) {
            return DEFAULT_CATEGORY;
        }
        return rawCategory.trim();
    }
}
