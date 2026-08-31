package com.finance.flfp.investment.dto;

import com.finance.flfp.investment.model.InvestmentStyle;
import com.finance.flfp.investment.model.InvestmentType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class InvestmentResponse {
    private Long id;
    private Long accountId;
    private String investmentName;
    private InvestmentType investmentType;
    private InvestmentStyle investmentStyle;
    private BigDecimal investedAmount;
    private BigDecimal rateOfInterest;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private Boolean isExcludedFromPrincipal;
    private String comments;
    private LocalDateTime createdAt;
}
