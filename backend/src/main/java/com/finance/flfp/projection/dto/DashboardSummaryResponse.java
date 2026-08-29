package com.finance.flfp.projection.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class DashboardSummaryResponse {
    private Long accountId;
    private BigDecimal currentBalance;
    private BigDecimal projectedBalance30Days;
    private BigDecimal projectedBalance1Year;
    private LocalDateTime calculatedAt;
}
