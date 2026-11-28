package com.travel.planner.service;

import com.travel.planner.dto.CreateItineraryItemRequest;
import com.travel.planner.dto.ItineraryItemResponse;
import com.travel.planner.dto.ReorderItemRequest;
import com.travel.planner.dto.ReorderItineraryItemRequest;
import com.travel.planner.dto.UpdateItineraryItemRequest;
import com.travel.planner.model.ItineraryItem;
import com.travel.planner.model.Place;
import com.travel.planner.model.Trip;
import com.travel.planner.model.User;
import com.travel.planner.repository.ItineraryItemRepository;
import com.travel.planner.repository.PlaceRepository;
import com.travel.planner.security.TripSecurityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Chức năng: Xử lý các nghiệp vụ quản lý lịch trình chi tiết của chuyến đi (Xem danh sách, Thêm, Cập nhật, Xóa, Kéo thả đổi vị trí).
 */
@Service
@RequiredArgsConstructor
public class ItineraryService {

    // Ngưỡng tối thiểu giữa 2 vị trí trước khi không thể chia đôi được nữa
    public static final double MIN_INTERVAL = 0.0001;

    // Khoảng cách chuẩn khi phân bố lại (rebalance) toàn bộ vị trí
    public static final double DEFAULT_STEP = 1.0;

    private final ItineraryItemRepository itineraryItemRepository;
    private final PlaceRepository placeRepository;
    private final TripSecurityService tripSecurityService;

    // Lấy danh sách tất cả địa điểm trong lịch trình theo thứ tự ngày và vị trí
    @Transactional(readOnly = true)
    public List<ItineraryItemResponse> getItinerary(Long tripId, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        return itineraryItemRepository.findAllByTripIdWithPlace(tripId)
                .stream()
                .map(ItineraryItemResponse::fromEntity)
                .toList();
    }

    // Thêm địa điểm vào ngày trong lịch trình, tự động gán orderIndex ở cuối danh sách ngày đó
    @Transactional
    public ItineraryItemResponse addItineraryItem(Long tripId, CreateItineraryItemRequest request, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa điểm với ID: " + request.getPlaceId()));

        long totalDays = ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;
        if (request.getDayNumber() > totalDays) {
            throw new IllegalArgumentException(String.format(
                    "Ngày lịch trình (dayNumber = %d) vượt quá tổng số ngày của chuyến đi (%d ngày).",
                    request.getDayNumber(), totalDays));
        }

        validateTimes(request.getStartTime(), request.getEndTime());

        Double maxPosition = itineraryItemRepository
                .findMaxPositionIndexByTripIdAndDayNumber(tripId, request.getDayNumber())
                .orElse(0.0);
        Double nextPosition = maxPosition + DEFAULT_STEP;

        ItineraryItem item = ItineraryItem.builder()
                .trip(trip)
                .place(place)
                .dayNumber(request.getDayNumber())
                .positionIndex(nextPosition)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .note(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null)
                .build();

        ItineraryItem saved = itineraryItemRepository.save(item);
        return ItineraryItemResponse.fromEntity(saved);
    }

    // Cập nhật thông tin thời gian tham quan, ghi chú (và tùy chọn đổi vị trí nếu có thông tin thứ tự)
    @Transactional
    public ItineraryItemResponse updateItineraryItem(Long tripId, Long itemId, UpdateItineraryItemRequest request, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        ItineraryItem item = itineraryItemRepository.findByItemIdAndTripIdWithPlace(itemId, tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy mục lịch trình với ID: " + itemId));

        validateTimes(request.getStartTime(), request.getEndTime());

        boolean isReorderOnly = (request.getPrevItemId() != null || request.getNextItemId() != null || request.getOrderIndex() != null)
                && request.getStartTime() == null && request.getEndTime() == null && request.getNote() == null;

        if (!isReorderOnly) {
            item.setStartTime(request.getStartTime());
            item.setEndTime(request.getEndTime());
            if (request.getNote() != null) {
                item.setNote(request.getNote().isBlank() ? null : request.getNote().trim());
            }
            itineraryItemRepository.save(item);
        }

        // Nếu request có kèm theo thông tin kéo thả đổi thứ tự
        if (request.getPrevItemId() != null || request.getNextItemId() != null || request.getOrderIndex() != null) {
            ReorderItineraryItemRequest reorderRequest = ReorderItineraryItemRequest.builder()
                    .prevItemId(request.getPrevItemId())
                    .nextItemId(request.getNextItemId())
                    .orderIndex(request.getOrderIndex())
                    .build();
            return reorderItineraryItem(tripId, itemId, reorderRequest, currentUser);
        }

        return ItineraryItemResponse.fromEntity(item);
    }

    // Xóa cứng một địa điểm khỏi lịch trình
    @Transactional
    public void deleteItineraryItem(Long tripId, Long itemId, User currentUser) {
        tripSecurityService.getTripIfMember(tripId, currentUser);

        ItineraryItem item = itineraryItemRepository.findByItemIdAndTrip_TripId(itemId, tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy mục lịch trình với ID: " + itemId));

        itineraryItemRepository.delete(item);
    }

    // Thay đổi thứ tự địa điểm khi kéo thả (chia đôi orderIndex, tự rebalance khi đạt giới hạn)
    @Transactional
    public ItineraryItemResponse reorderItineraryItem(Long tripId, Long itemId, ReorderItineraryItemRequest request, User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        ItineraryItem item = itineraryItemRepository.findByItemIdAndTripIdWithPlace(itemId, tripId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy mục lịch trình với ID: " + itemId));

        Integer targetDay = request.getTargetDayNumber() != null ? request.getTargetDayNumber() : item.getDayNumber();
        if (targetDay != null) {
            long totalDays = ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;
            if (targetDay < 1 || targetDay > totalDays) {
                throw new IllegalArgumentException(String.format(
                        "Ngày lịch trình mục tiêu (dayNumber = %d) vượt quá số ngày của chuyến đi (%d ngày).",
                        targetDay, totalDays));
            }
        }
        item.setDayNumber(targetDay);

        // Lấy tất cả các item khác trong ngày đích (không tính item đang di chuyển)
        List<ItineraryItem> otherItems = new ArrayList<>(itineraryItemRepository
                .findByTrip_TripIdAndDayNumberOrderByPositionIndexAsc(tripId, targetDay)
                .stream()
                .filter(i -> !i.getItemId().equals(itemId))
                .collect(Collectors.toList()));

        // Trường hợp 1: Client gửi trực tiếp orderIndex mong muốn
        if (request.getOrderIndex() != null) {
            double desiredIndex = request.getOrderIndex();
            boolean tooClose = otherItems.stream()
                    .anyMatch(other -> Math.abs(other.getPositionIndex() - desiredIndex) < MIN_INTERVAL);

            if (tooClose) {
                rebalanceWithItem(otherItems, item, desiredIndex);
            } else {
                item.setPositionIndex(desiredIndex);
                itineraryItemRepository.save(item);
            }
            return ItineraryItemResponse.fromEntity(item);
        }

        // Trường hợp 2: Kéo thả dựa trên vị trí liền trước (prevItemId) và liền sau (nextItemId)
        ItineraryItem prevItem = null;
        if (request.getPrevItemId() != null) {
            prevItem = itineraryItemRepository.findByItemIdAndTrip_TripId(request.getPrevItemId(), tripId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa điểm liền trước với ID: " + request.getPrevItemId()));
        }

        ItineraryItem nextItem = null;
        if (request.getNextItemId() != null) {
            nextItem = itineraryItemRepository.findByItemIdAndTrip_TripId(request.getNextItemId(), tripId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy địa điểm liền sau với ID: " + request.getNextItemId()));
        }

        applyMidpointOrRebalance(otherItems, item, prevItem, nextItem);

        return ItineraryItemResponse.fromEntity(item);
    }

    /**
     * Cập nhật đồng bộ thứ tự hàng loạt địa điểm trong 1 giao dịch DB duy nhất.
     * Hỗ trợ cả trường hợp đổi thứ tự trong cùng 1 ngày lẫn chuyển địa điểm sang ngày khác,
     * đồng thời chuẩn hóa lại position_index (1.0, 2.0, 3.0...) trên các ngày bị ảnh hưởng
     * để đảm bảo không bị trùng hoặc lệch order_index.
     */
    @Transactional
    public List<ItineraryItemResponse> reorderItinerary(
            Long tripId,
            List<ReorderItemRequest> requests,
            User currentUser) {
        Trip trip = tripSecurityService.getTripIfMember(tripId, currentUser);

        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("Danh sách địa điểm cần sắp xếp không được để trống.");
        }

        long totalDays = ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;
        Set<Long> requestedItemIds = new HashSet<>();
        for (ReorderItemRequest req : requests) {
            if (req == null) {
                throw new IllegalArgumentException("Phần tử trong danh sách sắp xếp không được null.");
            }
            if (req.getItemId() == null) {
                throw new IllegalArgumentException("ID mục lịch trình (itemId) không được để trống.");
            }
            if (req.getOrderIndex() == null || Double.isNaN(req.getOrderIndex()) || Double.isInfinite(req.getOrderIndex())) {
                throw new IllegalArgumentException("Thứ tự vị trí (orderIndex) không được để trống hoặc không hợp lệ.");
            }
            if (!requestedItemIds.add(req.getItemId())) {
                throw new IllegalArgumentException("Danh sách sắp xếp bị trùng lặp itemId: " + req.getItemId());
            }
            if (req.getDayNumber() != null && (req.getDayNumber() < 1 || req.getDayNumber() > totalDays)) {
                throw new IllegalArgumentException(String.format(
                        "Ngày lịch trình mục tiêu (dayNumber = %d) vượt quá tổng số ngày của chuyến đi (%d ngày).",
                        req.getDayNumber(), totalDays));
            }
        }

        List<ItineraryItem> allItems = new ArrayList<>(itineraryItemRepository.findAllByTripIdWithPlace(tripId));
        Map<Long, ItineraryItem> itemMap = allItems.stream()
                .collect(Collectors.toMap(ItineraryItem::getItemId, Function.identity()));

        for (ReorderItemRequest req : requests) {
            if (!itemMap.containsKey(req.getItemId())) {
                throw new EntityNotFoundException("Không tìm thấy mục lịch trình với ID: " + req.getItemId());
            }
        }

        // Lưu lại các ngày bị ảnh hưởng (bao gồm cả ngày nguồn cũ và ngày đích mới) để chuẩn hóa index đồng bộ
        Set<Integer> affectedDays = new LinkedHashSet<>();
        Map<Long, Integer> requestOrderMap = new HashMap<>();

        for (int idx = 0; idx < requests.size(); idx++) {
            ReorderItemRequest req = requests.get(idx);
            ItineraryItem item = itemMap.get(req.getItemId());

            affectedDays.add(item.getDayNumber());
            affectedDays.add(req.getDayNumber());
            requestOrderMap.put(req.getItemId(), idx);

            item.setDayNumber(req.getDayNumber());
            item.setPositionIndex(req.getOrderIndex());
        }

        // Chuẩn hóa positionIndex = 1.0, 2.0, 3.0... cho từng ngày bị ảnh hưởng để không bao giờ trùng hoặc lệch
        for (Integer day : affectedDays) {
            List<ItineraryItem> dayItems = allItems.stream()
                    .filter(item -> Objects.equals(item.getDayNumber(), day))
                    .sorted((a, b) -> compareItemsForRebalance(a, b, requestOrderMap))
                    .toList();

            for (int i = 0; i < dayItems.size(); i++) {
                dayItems.get(i).setPositionIndex((double) (i + 1));
            }
        }

        itineraryItemRepository.saveAll(allItems);

        allItems.sort(Comparator
                .comparing(ItineraryItem::getDayNumber, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(ItineraryItem::getPositionIndex, Comparator.nullsLast(Double::compareTo))
                .thenComparing(ItineraryItem::getItemId, Comparator.nullsLast(Long::compareTo)));

        return allItems.stream()
                .map(ItineraryItemResponse::fromEntity)
                .toList();
    }

    // So sánh thứ tự item trong cùng một ngày đảm bảo tính bắc cầu (strict weak ordering) khi chuẩn hóa
    private int compareItemsForRebalance(
            ItineraryItem a,
            ItineraryItem b,
            Map<Long, Integer> requestOrderMap) {
        double posA = a.getPositionIndex() != null ? a.getPositionIndex() : Double.MAX_VALUE;
        double posB = b.getPositionIndex() != null ? b.getPositionIndex() : Double.MAX_VALUE;
        if (posA == 0.0) posA = 0.0;
        if (posB == 0.0) posB = 0.0;

        int posCmp = Double.compare(posA, posB);
        if (posCmp != 0) {
            return posCmp;
        }

        Integer reqIdxA = requestOrderMap.get(a.getItemId());
        Integer reqIdxB = requestOrderMap.get(b.getItemId());
        if (reqIdxA != null && reqIdxB != null) {
            return Integer.compare(reqIdxA, reqIdxB);
        }
        if (reqIdxA != null) {
            return -1;
        }
        if (reqIdxB != null) {
            return 1;
        }

        return Comparator.nullsLast(Long::compareTo).compare(a.getItemId(), b.getItemId());
    }

    // Áp dụng thuật toán chia đôi hoặc phân bố lại khi đạt giới hạn chia
    private void applyMidpointOrRebalance(
            List<ItineraryItem> otherItems,
            ItineraryItem item,
            ItineraryItem prevItem,
            ItineraryItem nextItem
    ) {
        // Trường hợp 2.1: Kéo vào giữa 2 item
        if (prevItem != null && nextItem != null) {
            double prevIndex = prevItem.getPositionIndex();
            double nextIndex = nextItem.getPositionIndex();
            double diff = nextIndex - prevIndex;

            if (diff < MIN_INTERVAL) {
                // Đã chia đến nhỏ nhất không chia được nữa -> Rebalance toàn bộ index trong ngày
                int insertPos = findItemIndex(otherItems, prevItem.getItemId()) + 1;
                otherItems.add(insertPos, item);
                reassignAllIndices(otherItems);
            } else {
                // Chia đôi vị trí giữa 2 item
                item.setPositionIndex((prevIndex + nextIndex) / 2.0);
                itineraryItemRepository.save(item);
            }
            return;
        }

        // Trường hợp 2.2: Kéo lên đầu danh sách ngày (prevItem == null && nextItem != null)
        if (prevItem == null && nextItem != null) {
            double nextIndex = nextItem.getPositionIndex();

            if (nextIndex <= MIN_INTERVAL) {
                // Đã chia đến nhỏ nhất không chia được nữa -> Rebalance
                otherItems.add(0, item);
                reassignAllIndices(otherItems);
            } else {
                // Chia đôi vị trí đầu tiên
                item.setPositionIndex(nextIndex / 2.0);
                itineraryItemRepository.save(item);
            }
            return;
        }

        // Trường hợp 2.3: Kéo xuống cuối danh sách ngày (prevItem != null && nextItem == null)
        if (prevItem != null && nextItem == null) {
            double prevIndex = prevItem.getPositionIndex();
            item.setPositionIndex(prevIndex + DEFAULT_STEP);
            itineraryItemRepository.save(item);
            return;
        }

        // Trường hợp 2.4: Ngày chưa có điểm nào khác hoặc cả prevItem và nextItem đều null
        if (otherItems.isEmpty()) {
            item.setPositionIndex(DEFAULT_STEP);
            itineraryItemRepository.save(item);
        } else {
            otherItems.add(0, item);
            reassignAllIndices(otherItems);
        }
    }

    // Đánh số lại toàn bộ index cách đều nhau (1.0, 2.0, 3.0, ...) khi đạt giới hạn chia đôi
    private void reassignAllIndices(List<ItineraryItem> items) {
        for (int i = 0; i < items.size(); i++) {
            ItineraryItem current = items.get(i);
            current.setPositionIndex((double) (i + 1));
            itineraryItemRepository.save(current);
        }
    }

    // Chèn item vào danh sách theo vị trí desiredIndex và rebalance lại
    private void rebalanceWithItem(List<ItineraryItem> otherItems, ItineraryItem item, double desiredIndex) {
        int insertPos = 0;
        while (insertPos < otherItems.size() && otherItems.get(insertPos).getPositionIndex() < desiredIndex) {
            insertPos++;
        }
        otherItems.add(insertPos, item);
        reassignAllIndices(otherItems);
    }

    // Tìm chỉ số của item trong danh sách
    private int findItemIndex(List<ItineraryItem> items, Long itemId) {
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).getItemId().equals(itemId)) {
                return i;
            }
        }
        return items.size() - 1;
    }

    // Kiểm tra tính hợp lệ của thời gian (endTime >= startTime nếu cả 2 được cung cấp)
    private void validateTimes(LocalTime startTime, LocalTime endTime) {
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new IllegalArgumentException("Thời gian kết thúc (endTime) phải lớn hơn hoặc bằng thời gian bắt đầu (startTime).");
        }
    }
}
