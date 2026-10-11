package com.travel.planner.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "destinations", schema = "analytics")
@NoArgsConstructor
@Immutable
public class Destination {

    @Id
    @Column(name = "destination_id")
    private Long destinationId;

    @Column(name = "slug")
    private String slug;

    @Column(name = "name")
    private String name;
}
