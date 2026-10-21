package com.travel.planner.controller;

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
@RequestMapping("/api/destinations")
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

    @GetMapping("/{slug}")
    @Operation(summary = "Tìm kiếm / lấy chi tiết 1 tỉnh/thành phố", description = "Tìm kiếm chi tiết 1 tỉnh/thành phố theo slug (VD: 'da_nang') hoặc mã tỉnh (VD: '48') kèm toạ độ trung tâm (centroid)")
    public ResponseEntity<DestinationResponse> getDestinationBySlug(
            @Parameter() @PathVariable("slug") String slug) {
        return ResponseEntity.ok(destinationService.getDestinationBySlug(slug));
    }
}
