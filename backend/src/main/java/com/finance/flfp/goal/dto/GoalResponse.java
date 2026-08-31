package com.finance.flfp.goal.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class GoalResponse {
    private Long id;
    private Long accountId;
    private String goalName;
    private BigDecimal targetAmount;
    private LocalDate targetDate;
    private String notes;
    private BigDecimal currentProjectedAmount;
    private Boolean isOnTrack;
    private LocalDateTime createdAt;
}
