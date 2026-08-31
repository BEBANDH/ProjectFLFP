package com.finance.flfp.projection.controller;

import com.finance.flfp.projection.dto.DashboardSummaryResponse;
import com.finance.flfp.projection.dto.ProjectionResponse;
import com.finance.flfp.projection.service.ProjectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/projections")
@RequiredArgsConstructor
public class ProjectionController {

    private final ProjectionService projectionService;

    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(@RequestParam Long accountId) {
        return ResponseEntity.ok(projectionService.getDashboardSummary(accountId));
    }

    @GetMapping("/calculate-date")
    public ResponseEntity<ProjectionResponse> calculateProjectionDate(
            @RequestParam Long accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate) {
        return ResponseEntity.ok(projectionService.calculateProjection(accountId, targetDate));
    }

    @GetMapping("/fire-summary")
    public ResponseEntity<com.finance.flfp.projection.dto.FireSummaryResponse> getFireSummary(@RequestParam Long accountId) {
        return ResponseEntity.ok(projectionService.getFireSummary(accountId));
    }
}
