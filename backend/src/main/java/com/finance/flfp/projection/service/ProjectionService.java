package com.finance.flfp.projection.service;

import com.finance.flfp.account.model.Account;
import com.finance.flfp.account.repository.AccountRepository;
import com.finance.flfp.credit.model.Credit;
import com.finance.flfp.credit.repository.CreditRepository;
import com.finance.flfp.expense.model.Expense;
import com.finance.flfp.expense.repository.ExpenseRepository;
import com.finance.flfp.investment.model.Investment;
import com.finance.flfp.investment.repository.InvestmentRepository;
import com.finance.flfp.expense.model.ExpenseType;
import com.finance.flfp.expense.model.RecurrenceInterval;
import com.finance.flfp.projection.dto.DashboardSummaryResponse;
import com.finance.flfp.projection.dto.FireSummaryResponse;
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

    @Transactional(readOnly = true)
    public com.finance.flfp.projection.dto.FireSummaryResponse getFireSummary(Long accountId) {
        Account account = getAccount(accountId);
        List<Credit> credits = creditRepository.findByAccountId(accountId);
        List<Expense> expenses = expenseRepository.findByAccountId(accountId);
        List<Investment> investments = investmentRepository.findByAccountId(accountId);

        BigDecimal monthlyIncome = BigDecimal.ZERO;
        for (Credit c : credits) {
            if (c.getRecurrenceInterval() != null) {
                switch (c.getRecurrenceInterval()) {
                    case MONTHLY -> monthlyIncome = monthlyIncome.add(c.getAmount());
                    case ANNUAL -> monthlyIncome = monthlyIncome.add(c.getAmount().divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP));
                    case WEEKLY -> monthlyIncome = monthlyIncome.add(c.getAmount().multiply(BigDecimal.valueOf(4.33)));
                    default -> {}
                }
            }
        }

        BigDecimal monthlyExpenses = BigDecimal.ZERO;
        for (Expense e : expenses) {
            if (e.getExpenseType() == com.finance.flfp.expense.model.ExpenseType.RECURRING && e.getRecurrenceInterval() != null) {
                switch (e.getRecurrenceInterval()) {
                    case MONTHLY -> monthlyExpenses = monthlyExpenses.add(e.getAmount());
                    case ANNUAL -> monthlyExpenses = monthlyExpenses.add(e.getAmount().divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP));
                    case WEEKLY -> monthlyExpenses = monthlyExpenses.add(e.getAmount().multiply(BigDecimal.valueOf(4.33)));
                    case DAILY -> monthlyExpenses = monthlyExpenses.add(e.getAmount().multiply(BigDecimal.valueOf(30)));
                    default -> {}
                }
            }
        }

        BigDecimal savingsRate = BigDecimal.ZERO;
        if (monthlyIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal netSaved = monthlyIncome.subtract(monthlyExpenses);
            savingsRate = netSaved.divide(monthlyIncome, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }

        BigDecimal annualExpenses = monthlyExpenses.multiply(BigDecimal.valueOf(12));
        BigDecimal fireTargetNumber = annualExpenses.multiply(BigDecimal.valueOf(25)); // 4% Rule

        BigDecimal currentInvested = investments.stream()
                .map(Investment::getInvestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nestEgg = account.getCurrentBalance().add(currentInvested);

        BigDecimal progressPercent = BigDecimal.ZERO;
        if (fireTargetNumber.compareTo(BigDecimal.ZERO) > 0) {
            progressPercent = nestEgg.divide(fireTargetNumber, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }

        boolean isAchieved = nestEgg.compareTo(fireTargetNumber) >= 0 && fireTargetNumber.compareTo(BigDecimal.ZERO) > 0;

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate crossoverDate = null;

        if (isAchieved) {
            crossoverDate = today;
        } else if (fireTargetNumber.compareTo(BigDecimal.ZERO) > 0) {
            for (int month = 1; month <= 480; month++) { // Simulate up to 40 years
                LocalDate target = today.plusMonths(month);
                BigDecimal proj = calculationEngine.calculateProjectedBalance(account, credits, expenses, investments, today, target);
                if (proj.compareTo(fireTargetNumber) >= 0) {
                    crossoverDate = target;
                    break;
                }
            }
        }

        return com.finance.flfp.projection.dto.FireSummaryResponse.builder()
                .accountId(accountId)
                .monthlyIncome(monthlyIncome)
                .monthlyExpenses(monthlyExpenses)
                .savingsRatePercent(savingsRate)
                .fireTargetNumber(fireTargetNumber)
                .currentPortfolioNestEgg(nestEgg)
                .fireProgressPercent(progressPercent)
                .fireCrossoverDate(crossoverDate)
                .isFireAchieved(isAchieved)
                .calculatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }

    private Account getAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + accountId));
    }
}
