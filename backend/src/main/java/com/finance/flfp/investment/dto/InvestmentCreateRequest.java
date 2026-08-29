package com.finance.flfp.investment.dto;

import com.finance.flfp.investment.model.InvestmentStyle;
import com.finance.flfp.investment.model.InvestmentType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvestmentCreateRequest {

    @NotNull(message = "accountId is required")
    private Long accountId;

    @NotBlank(message = "investmentName is required")
    @Size(max = 100, message = "investmentName must not exceed 100 characters")
    private String investmentName;

    @NotNull(message = "investmentType is required")
    private InvestmentType investmentType;

    @NotNull(message = "investmentStyle is required")
    private InvestmentStyle investmentStyle;

    @NotNull(message = "investedAmount is required")
    @DecimalMin(value = "0.01", message = "Invested amount must be greater than zero")
    private BigDecimal investedAmount;

    @NotNull(message = "rateOfInterest is required")
    @DecimalMin(value = "0.00", message = "Rate of interest cannot be negative")
    @DecimalMax(value = "100.00", message = "Rate of interest cannot exceed 100")
    private BigDecimal rateOfInterest;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    private LocalDate maturityDate;

    private String comments;
}
