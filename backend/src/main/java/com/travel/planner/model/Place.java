package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;
import java.time.LocalDateTime;

@Entity
@Table(name = "places", schema = "analytics")
@NoArgsConstructor
@Getter
@Immutable
public class Place {

    @Id
    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "source")
    private String source;

    @Column(name = "source_id")
    private String sourceId;

    @Column(name = "fetched_at")
    private LocalDateTime fetchedAt;

    @Column(name = "name")
    private String name;

    @Column(name = "category")
    private String category;

    @Column(name = "subcategory")
    private String subcategory;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone")
    private String phone;

    @Column(name = "website", columnDefinition = "TEXT")
    private String website;

    @Column(name = "opening_hours", columnDefinition = "TEXT")
    private String openingHours;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id")
    private Destination destination;

    @Column(name = "rating", precision = 3, scale = 2)
    private java.math.BigDecimal rating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;
}
