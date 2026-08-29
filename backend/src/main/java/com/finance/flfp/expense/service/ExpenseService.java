package com.finance.flfp.expense.service;

import com.finance.flfp.account.model.Account;
import com.finance.flfp.account.repository.AccountRepository;
import com.finance.flfp.expense.dto.ExpenseCreateRequest;
import com.finance.flfp.expense.dto.ExpenseResponse;
import com.finance.flfp.expense.model.Expense;
import com.finance.flfp.expense.model.ExpenseType;
import com.finance.flfp.expense.model.RecurrenceInterval;
import com.finance.flfp.expense.repository.ExpenseRepository;
import com.finance.flfp.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final AccountRepository accountRepository; // Injected directly to prevent circular dependencies

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ExpenseResponse createExpense(ExpenseCreateRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        // Handle INSTANT expense deduction logic
        if (request.getExpenseType() == ExpenseType.INSTANT) {
            // Force interval to NONE for instant expenses
            request.setRecurrenceInterval(RecurrenceInterval.NONE);
            account.setCurrentBalance(account.getCurrentBalance().subtract(request.getAmount()));
            accountRepository.save(account);
        }

        Expense expense = Expense.builder()
                .account(account)
                .name(request.getName())
                .amount(request.getAmount())
                .expenseType(request.getExpenseType())
                .recurrenceInterval(request.getRecurrenceInterval())
                .startDate(request.getStartDate())
                .notes(request.getNotes())
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        return mapToResponse(savedExpense);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByAccountId(Long accountId) {
        return expenseRepository.findByAccountId(accountId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteExpense(Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + expenseId));
        
        // If it was an INSTANT expense, refund the account balance to maintain historical accuracy
        if (expense.getExpenseType() == ExpenseType.INSTANT) {
            Account account = expense.getAccount();
            account.setCurrentBalance(account.getCurrentBalance().add(expense.getAmount()));
            accountRepository.save(account);
        }

        expenseRepository.delete(expense);
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .accountId(expense.getAccount().getId()) // Flattened mapping
                .name(expense.getName())
                .amount(expense.getAmount())
                .expenseType(expense.getExpenseType())
                .recurrenceInterval(expense.getRecurrenceInterval())
                .startDate(expense.getStartDate())
                .notes(expense.getNotes())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
