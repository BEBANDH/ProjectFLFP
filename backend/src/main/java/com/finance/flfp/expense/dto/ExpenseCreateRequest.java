package com.finance.flfp.expense.dto;

import com.finance.flfp.expense.model.ExpenseType;
import com.finance.flfp.expense.model.RecurrenceInterval;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseCreateRequest {

    @NotNull(message = "accountId is required")
    private Long accountId;

    @NotBlank(message = "name is required")
    @Size(max = 100, message = "name must not exceed 100 characters")
    private String name;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "Expense amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "expenseType is required")
    private ExpenseType expenseType;

    @NotNull(message = "recurrenceInterval is required")
    private RecurrenceInterval recurrenceInterval;

    @NotNull(message = "startDate is required")
    private LocalDate startDate;

    private String notes;
}
