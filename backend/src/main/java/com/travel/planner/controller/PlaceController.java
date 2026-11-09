package com.travel.planner.controller;

import com.travel.planner.dto.PlaceDetailResponse;
import com.travel.planner.service.PlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
// Map song song: FE (explore.service.ts) goi /api/v1/places, giu /api/places de khong vo client cu
@RequestMapping({"/api/v1/places", "/api/places"})
@RequiredArgsConstructor
@Tag(name = "Places", description = "APIs địa điểm du lịch")
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping
    @Operation(summary = "Tìm kiếm & lọc danh sách địa điểm", description = "Hỗ trợ tìm kiếm theo tên tiếng Việt, lọc theo mã tỉnh hoặc slug, category, sắp xếp (sort=rating_desc hoặc name_asc) và phân trang (page, size).")
    public ResponseEntity<Page<PlaceDetailResponse>> getPlaces(
            @Parameter(description = "Từ khóa tìm kiếm tên địa điểm", example = "Chợ Bến Thành") @RequestParam(value = "keyword", required = false) String keyword,
            @Parameter(description = "Alias của keyword", hidden = true) @RequestParam(value = "q", required = false) String q,
            @Parameter(description = "Mã tỉnh hoặc slug", example = "79") @RequestParam(value = "destinationId", required = false) String destinationId,
            @Parameter(description = "Danh mục lọc", example = "restaurant") @RequestParam(value = "category", required = false) String category,
            @Parameter(description = "Sắp xếp: 'rating_desc' (mặc định) hoặc 'name_asc'", example = "rating_desc") @RequestParam(value = "sort", required = false) String sort,
            Pageable pageable) {
        String searchTerm = (keyword != null && !keyword.trim().isEmpty()) ? keyword : q;
        return ResponseEntity.ok(placeService.getPlaces(searchTerm, destinationId, category, sort, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết 1 địa điểm theo ID")
    public ResponseEntity<PlaceDetailResponse> getPlaceById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(placeService.getPlaceById(id));
    }
}
