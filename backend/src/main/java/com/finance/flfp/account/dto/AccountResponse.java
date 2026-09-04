package com.finance.flfp.account.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AccountResponse {
    private Long id;
    private Long userId;
    private String accountName;
    private String bankName;
    private BigDecimal currentBalance;
    private BigDecimal fireTargetAmount;
    private LocalDateTime createdAt;
}
