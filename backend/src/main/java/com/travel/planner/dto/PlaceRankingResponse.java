package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceRankingResponse {
    private Double rankingScore;
    private Double subcatPart;
    private Double wikiPart;
    private Double ratingPart;
    private Double reviewPart;
    private String formulaVersion;
}
