package com.finance.flfp.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountCreateRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotBlank(message = "accountName is required")
    @Size(max = 100, message = "accountName must not exceed 100 characters")
    private String accountName;

    @Size(max = 100, message = "bankName must not exceed 100 characters")
    private String bankName;

    @NotNull(message = "currentBalance is required")
    @DecimalMin(value = "0.00", message = "Initial balance cannot be negative")
    private BigDecimal currentBalance;
}
