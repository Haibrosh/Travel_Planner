package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Chức năng: Entity chỉ đọc ánh xạ bảng 'analytics.places_v2' - POI du lịch & làm giàu từ Google Maps.
 * @Immutable: Hibernate không bao giờ UPDATE bảng này.
 */
@Entity
@Table(name = "places_v2", schema = "analytics")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Immutable
public class Place {

    @Id
    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "source", nullable = false, length = 50)
    private String source;

    @Column(name = "source_id", nullable = false, length = 100)
    private String sourceId;

    @Column(name = "osm_type", length = 20)
    private String osmType;

    @Column(name = "osm_id")
    private Long osmId;

    @Column(name = "fetched_at", nullable = false)
    private OffsetDateTime fetchedAt;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "subcategory", length = 100)
    private String subcategory;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone", columnDefinition = "TEXT")
    private String phone;

    @Column(name = "website", columnDefinition = "TEXT")
    private String website;

    @Column(name = "opening_hours", columnDefinition = "TEXT")
    private String openingHours;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_code", referencedColumnName = "province_code", nullable = false)
    private Destination destination;

    @Column(name = "province_method", nullable = false, length = 20)
    private String provinceMethod;

    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "enrichment_provider", length = 50)
    private String enrichmentProvider;

    @Column(name = "enrichment_provider_id", length = 200)
    private String enrichmentProviderId;

    @Column(name = "match_confidence", precision = 4, scale = 3)
    private BigDecimal matchConfidence;

    @Column(name = "enriched_at")
    private OffsetDateTime enrichedAt;
}
