package com.travel.planner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceContentResponse {
    private String language;
    private String contentSource;
    private String wikidataId;
    private String sourceTitle;
    private String sourceWikiUrl;
    private Long revisionId;
    private String summary;
    private String descriptionMd;
    private String license;
    private String attribution;
}
