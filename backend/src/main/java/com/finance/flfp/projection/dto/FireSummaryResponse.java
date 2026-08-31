package com.finance.flfp.projection.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class FireSummaryResponse {
    private Long accountId;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpenses;
    private BigDecimal savingsRatePercent;
    private BigDecimal fireTargetNumber;
    private BigDecimal currentPortfolioNestEgg;
    private BigDecimal fireProgressPercent;
    private LocalDate fireCrossoverDate;
    private Boolean isFireAchieved;
    private LocalDateTime calculatedAt;
}
