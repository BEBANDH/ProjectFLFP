package com.finance.flfp.projection.service;

import com.finance.flfp.account.model.Account;
import com.finance.flfp.account.repository.AccountRepository;
import com.finance.flfp.credit.model.Credit;
import com.finance.flfp.credit.repository.CreditRepository;
import com.finance.flfp.expense.model.Expense;
import com.finance.flfp.expense.repository.ExpenseRepository;
import com.finance.flfp.investment.model.Investment;
import com.finance.flfp.investment.repository.InvestmentRepository;
import com.finance.flfp.projection.dto.DashboardSummaryResponse;
import com.finance.flfp.projection.dto.ProjectionResponse;
import com.finance.flfp.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectionService {

    private final AccountRepository accountRepository;
    private final CreditRepository creditRepository;
    private final ExpenseRepository expenseRepository;
    private final InvestmentRepository investmentRepository;
    private final ProjectionCalculationEngine calculationEngine;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(Long accountId) {
        Account account = getAccount(accountId);
        List<Credit> credits = creditRepository.findByAccountId(accountId);
        List<Expense> expenses = expenseRepository.findByAccountId(accountId);
        List<Investment> investments = investmentRepository.findByAccountId(accountId);
        
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        BigDecimal balance30Days = calculationEngine.calculateProjectedBalance(
                account, credits, expenses, investments, today, today.plusDays(30));

        BigDecimal balance1Year = calculationEngine.calculateProjectedBalance(
                account, credits, expenses, investments, today, today.plusDays(365));

        return DashboardSummaryResponse.builder()
                .accountId(accountId)
                .currentBalance(account.getCurrentBalance())
                .projectedBalance30Days(balance30Days)
                .projectedBalance1Year(balance1Year)
                .calculatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectionResponse calculateProjection(Long accountId, LocalDate targetDate) {
        Account account = getAccount(accountId);
        List<Credit> credits = creditRepository.findByAccountId(accountId);
        List<Expense> expenses = expenseRepository.findByAccountId(accountId);
        List<Investment> investments = investmentRepository.findByAccountId(accountId);
        
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        BigDecimal projectedBalance = calculationEngine.calculateProjectedBalance(
                account, credits, expenses, investments, today, targetDate);

        BigDecimal deltaVariance = projectedBalance.subtract(account.getCurrentBalance());

        return ProjectionResponse.builder()
                .accountId(accountId)
                .targetDate(targetDate)
                .projectedBalance(projectedBalance)
                .deltaVariance(deltaVariance)
                .calculatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private Account getAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + accountId));
    }
}
