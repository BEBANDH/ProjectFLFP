package com.finance.flfp.credit.dto;

import com.finance.flfp.credit.model.CreditInterval;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreditCreateRequest {

    @NotNull(message = "accountId is required")
    private Long accountId;

    @NotBlank(message = "sourceName is required")
    @Size(max = 100, message = "sourceName must not exceed 100 characters")
    private String sourceName;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "Credit amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "recurrenceInterval is required")
    private CreditInterval recurrenceInterval;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    @DecimalMin(value = "0.0", message = "Growth percentage cannot be negative")
    private BigDecimal growthPercentage;
}
