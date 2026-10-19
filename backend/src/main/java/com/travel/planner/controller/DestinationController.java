package com.travel.planner.controller;

import com.travel.planner.dto.DestinationResponse;
import com.travel.planner.service.DestinationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}

