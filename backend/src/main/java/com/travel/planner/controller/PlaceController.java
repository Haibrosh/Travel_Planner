package com.travel.planner.controller;

import com.travel.planner.dto.PlaceDetailResponse;
import com.travel.planner.dto.PlaceNearbyResponse;
import com.travel.planner.dto.PlaceSearchResponse;
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
    @Operation(summary = "Tìm kiếm & lọc danh sách địa điểm", description = "Mặc định sắp xếp theo ranking_score DESC, hỗ trợ lọc theo tỉnh, category, sắp xếp và phân trang.")
    public ResponseEntity<Page<PlaceDetailResponse>> getPlaces(
            @Parameter(description = "Từ khóa tìm kiếm tên địa điểm", example = "Chợ Bến Thành") @RequestParam(value = "keyword", required = false) String keyword,
            @Parameter(description = "Alias của keyword", hidden = true) @RequestParam(value = "q", required = false) String q,
            @Parameter(description = "Mã tỉnh hoặc slug", example = "79") @RequestParam(value = "destinationId", required = false) String destinationId,
            @Parameter(description = "Danh mục lọc", example = "restaurant") @RequestParam(value = "category", required = false) String category,
            @Parameter(description = "Sắp xếp: 'ranking_desc' (mặc định), 'rating_desc' hoặc 'name_asc'", example = "ranking_desc") @RequestParam(value = "sort", required = false) String sort,
            Pageable pageable) {
        String searchTerm = (keyword != null && !keyword.trim().isEmpty()) ? keyword : q;
        return ResponseEntity.ok(placeService.getPlaces(searchTerm, destinationId, category, sort, pageable));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm địa điểm Hybrid (Trigram + Ranking Score)", description = "Kết hợp độ tương đồng text trigram và ranking score để trả về kết quả autocomplete tối ưu nhất.")
    public ResponseEntity<PlaceSearchResponse> searchPlaces(
            @Parameter(description = "Từ khóa tìm kiếm (tối thiểu 2 ký tự)", example = "bảo tàng", required = true) @RequestParam("q") String q,
            @Parameter(description = "Mã tỉnh để lọc phạm vi (optional)", example = "79") @RequestParam(value = "provinceCode", required = false) String provinceCode,
            @Parameter(description = "Mã tỉnh alias (optional)", hidden = true) @RequestParam(value = "province_code", required = false) String provinceCodeSnake,
            @Parameter(description = "Danh mục lọc (optional)", example = "attraction") @RequestParam(value = "category", required = false) String category,
            @Parameter(description = "Số lượng tối đa (mặc định 10, tối đa 30)", example = "10") @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit) {
        String finalProvince = (provinceCode != null && !provinceCode.trim().isEmpty()) ? provinceCode : provinceCodeSnake;
        return ResponseEntity.ok(placeService.searchPlacesHybrid(q, finalProvince, category, limit));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Tìm địa điểm lân cận theo tọa độ (GiST Index && ST_Expand + ST_DWithin)", description = "Tìm các địa điểm trong bán kính radiusMeters xung quanh tọa độ (lat, lon), sắp xếp theo ranking và khoảng cách.")
    public ResponseEntity<PlaceNearbyResponse> getNearbyPlaces(
            @Parameter(description = "Vĩ độ WGS84", example = "10.779365", required = true) @RequestParam("lat") Double lat,
            @Parameter(description = "Kinh độ WGS84", example = "106.692281", required = true) @RequestParam("lon") Double lon,
            @Parameter(description = "Bán kính tính theo mét (mặc định 2000m, tối đa 20000m)", example = "2000") @RequestParam(value = "radiusMeters", required = false, defaultValue = "2000") Integer radiusMeters,
            @Parameter(description = "Alias bán kính (optional)", hidden = true) @RequestParam(value = "radius_meters", required = false) Integer radiusMetersSnake,
            @Parameter(description = "Danh mục lọc (optional)", example = "attraction") @RequestParam(value = "category", required = false) String category,
            @Parameter(description = "Loại trừ placeId trung tâm (optional)", example = "101584") @RequestParam(value = "excludePlaceId", required = false) Long excludePlaceId,
            @Parameter(description = "Alias loại trừ placeId (optional)", hidden = true) @RequestParam(value = "exclude_place_id", required = false) Long excludePlaceIdSnake,
            @Parameter(description = "Số lượng tối đa (mặc định 15, tối đa 50)", example = "15") @RequestParam(value = "limit", required = false, defaultValue = "15") Integer limit) {
        Integer finalRadius = radiusMetersSnake != null ? radiusMetersSnake : radiusMeters;
        Long finalExclude = excludePlaceIdSnake != null ? excludePlaceIdSnake : excludePlaceId;
        return ResponseEntity.ok(placeService.findNearbyPlaces(lat, lon, finalRadius, category, finalExclude, limit));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết 1 địa điểm theo ID (kèm ranking & bài viết Wikipedia)", description = "Trả về thông tin chi tiết địa điểm kèm phân rã điểm ranking và bài viết Wikipedia tóm tắt nếu có.")
    public ResponseEntity<PlaceDetailResponse> getPlaceById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(placeService.getPlaceById(id));
    }
}
