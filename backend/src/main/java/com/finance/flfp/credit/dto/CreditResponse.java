package com.finance.flfp.credit.dto;

import com.finance.flfp.credit.model.CreditInterval;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CreditResponse {
    private Long id;
    private Long accountId;
    private String sourceName;
    private BigDecimal amount;
    private CreditInterval recurrenceInterval;
    private LocalDate startDate;
    private LocalDateTime createdAt;
}
