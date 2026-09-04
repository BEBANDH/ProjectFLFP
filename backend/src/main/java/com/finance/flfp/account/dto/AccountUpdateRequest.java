package com.finance.flfp.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountUpdateRequest {
    @NotBlank(message = "Account name is mandatory")
    private String accountName;
    
    @NotBlank(message = "Bank name is mandatory")
    private String bankName;
    
    @NotNull(message = "Current balance is mandatory")
    private BigDecimal currentBalance;

    private BigDecimal fireTargetAmount;
}
