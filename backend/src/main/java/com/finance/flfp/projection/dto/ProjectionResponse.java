package com.finance.flfp.projection.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ProjectionResponse {
    private Long accountId;
    private LocalDate targetDate;
    private BigDecimal projectedBalance;
    private BigDecimal deltaVariance;
    private LocalDateTime calculatedAt;
}
