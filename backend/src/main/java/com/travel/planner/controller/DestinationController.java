package com.travel.planner.controller;

import com.travel.planner.dto.DestinationRecommendationsResponse;
import com.travel.planner.dto.DestinationResponse;
import com.travel.planner.service.DestinationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
// Map song song: FE (explore.service.ts) goi /api/v1/destinations, giu /api/destinations de khong vo client cu
@RequestMapping({"/api/v1/destinations", "/api/destinations"})
@RequiredArgsConstructor
@Tag(name = "Destinations", description = "APIs truy vấn danh sách tỉnh thành và điểm đến")
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách 34 tỉnh/thành phố", description = "Trả về danh sách 34 tỉnh/thành phố du lịch kèm toạ độ trung tâm (centroid) sắp xếp theo tên A-Z")
    public ResponseEntity<List<DestinationResponse>> getAllDestinations() {
        return ResponseEntity.ok(destinationService.getAllDestinations());
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm tỉnh/thành phố theo từ khóa", description = "Tìm kiếm các tỉnh/thành phố theo từ khóa (tên tiếng Việt, tên tiếng Anh hoặc slug)")
    public ResponseEntity<List<DestinationResponse>> searchDestinations(
            @Parameter() @RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(destinationService.searchDestinations(keyword));
    }

    @GetMapping("/{slug}/recommendations")
    @Operation(summary = "Lấy danh sách địa điểm đề xuất cho tỉnh/thành phố", description = "Trả về Top 10-15 địa điểm được xếp hạng cao nhất của tỉnh/thành phố theo category.")
    public ResponseEntity<DestinationRecommendationsResponse> getRecommendations(
            @Parameter(description = "Mã tỉnh (VD: '48') hoặc slug (VD: 'da_nang')", example = "da_nang") @PathVariable("slug") String slug,
            @Parameter(description = "Danh mục ('attraction', 'hotel', 'restaurant', 'cafe', hoặc 'all')", example = "attraction") @RequestParam(value = "category", required = false, defaultValue = "attraction") String category,
            @Parameter(description = "Số lượng tối đa (mặc định 10, tối đa 50)", example = "10") @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit,
            @Parameter(description = "Vị trí bắt đầu", example = "0") @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        return ResponseEntity.ok(destinationService.getRecommendations(slug, category, limit, offset));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Tìm kiếm / lấy chi tiết 1 tỉnh/thành phố", description = "Tìm kiếm chi tiết 1 tỉnh/thành phố theo slug (VD: 'da_nang') hoặc mã tỉnh (VD: '48') kèm toạ độ trung tâm (centroid)")
    public ResponseEntity<DestinationResponse> getDestinationBySlug(
            @Parameter() @PathVariable("slug") String slug) {
        return ResponseEntity.ok(destinationService.getDestinationBySlug(slug));
    }
}
