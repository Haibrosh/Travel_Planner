package com.travel.planner.service;

import com.travel.planner.model.ItineraryItem;
import com.travel.planner.repository.ItineraryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for CRUD and business logic on {@link ItineraryItem}.
 */
@Service
@RequiredArgsConstructor
public class ItineraryItemService {

    private final ItineraryItemRepository repository;

    @Transactional(readOnly = true)
    public List<ItineraryItem> getItemsByTrip(Long tripId) {
        return repository.findByTripTripIdOrderByDayNumberAscPositionIndexAsc(tripId);
    }

    @Transactional(readOnly = true)
    public List<ItineraryItem> getItemsByTripAndDay(Long tripId, Integer dayNumber) {
        return repository.findByTripTripIdAndDayNumberOrderByPositionIndexAsc(tripId, dayNumber);
    }

    @Transactional(readOnly = true)
    public Optional<ItineraryItem> getItem(Long itemId) {
        return repository.findById(itemId);
    }

    @Transactional
    public ItineraryItem createItem(ItineraryItem item) {
        return repository.save(item);
    }

    @Transactional
    public ItineraryItem updateItem(ItineraryItem item) {
        Long id = item.getItemId();
        if (id == null) {
            throw new IllegalArgumentException("Item id must not be null for update");
        }
        ItineraryItem persisted = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ItineraryItem not found: " + id));
        if (item.getDayNumber() != null) persisted.setDayNumber(item.getDayNumber());
        if (item.getPositionIndex() != null) persisted.setPositionIndex(item.getPositionIndex());
        if (item.getStartTime() != null) persisted.setStartTime(item.getStartTime());
        if (item.getEndTime() != null) persisted.setEndTime(item.getEndTime());
        if (item.getPlace() != null) persisted.setPlace(item.getPlace());
        if (item.getTrip() != null) persisted.setTrip(item.getTrip());
        return repository.save(persisted);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        repository.deleteById(itemId);
    }

    /**
     * Persist a new ordering for the supplied list of items.
     * The list must be in the desired order; the method updates the {@code positionIndex}
     * (as a Double) to reflect the new order (0, 1, 2, …).
     */
    @Transactional
    public void saveNewOrder(List<ItineraryItem> orderedItems) {
        for (int i = 0; i < orderedItems.size(); i++) {
            ItineraryItem it = orderedItems.get(i);
            it.setPositionIndex((double) i);
        }
        repository.saveAll(orderedItems);
    }
}
