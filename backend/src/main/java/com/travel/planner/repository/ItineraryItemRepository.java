package com.travel.planner.repository;

import com.travel.planner.model.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for {@link ItineraryItem} entities.
 */
@Repository
public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, Long> {

    /**
     * Find all itinerary items belonging to a specific trip,
     * ordered by day number then position index.
     */
    List<ItineraryItem> findByTripTripIdOrderByDayNumberAscPositionIndexAsc(Long tripId);
}
