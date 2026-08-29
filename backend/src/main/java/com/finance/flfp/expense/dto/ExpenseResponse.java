package com.finance.flfp.expense.dto;

import com.finance.flfp.expense.model.ExpenseType;
import com.finance.flfp.expense.model.RecurrenceInterval;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ExpenseResponse {
    private Long id;
    private Long accountId;
    private String name;
    private BigDecimal amount;
    private ExpenseType expenseType;
    private RecurrenceInterval recurrenceInterval;
    private LocalDate startDate;
    private String notes;
    private LocalDateTime createdAt;
}
