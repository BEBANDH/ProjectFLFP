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

/**
 * ProjectionService — performance-optimised.
 *
 * Key improvements:
 *  1. All three methods (getDashboardSummary, calculateProjection, getFireSummary)
 *     previously issued 3 independent DB queries each.  Now they share a single
 *     loadAccountData() helper that issues exactly 4 queries (account + 3 collections)
 *     and passes the results through without re-querying.
 *
 *  2. The FIRE crossover date was computed with a brute-force linear scan over up to
 *     480 months (40 years × 12).  It is now found with binary search — O(log 480) ≈ 9
 *     iterations in the worst case.
 */
@Service
@RequiredArgsConstructor
public class ProjectionService {

    private final AccountRepository accountRepository;
    private final CreditRepository creditRepository;
    private final ExpenseRepository expenseRepository;
    private final InvestmentRepository investmentRepository;
    private final ProjectionCalculationEngine calculationEngine;

    // ─── Inner record to bundle pre-loaded account data ────────────────────────
    private record AccountData(
            Account account,
            List<Credit> credits,
            List<Expense> expenses,
            List<Investment> investments
    ) {}

    /**
     * Single-point DB fetch: 4 queries total, results reused by all methods.
     */
    private AccountData loadAccountData(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + accountId));
        List<Credit>     credits     = creditRepository.findByAccountId(accountId);
        List<Expense>    expenses    = expenseRepository.findByAccountId(accountId);
        List<Investment> investments = investmentRepository.findByAccountId(accountId);
        return new AccountData(account, credits, expenses, investments);
    }

    // ─── Public API ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(Long accountId) {
        AccountData d = loadAccountData(accountId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        BigDecimal balance30Days = calculationEngine.calculateProjectedBalance(
                d.account(), d.credits(), d.expenses(), d.investments(), today, today.plusDays(30));

        BigDecimal balance1Year = calculationEngine.calculateProjectedBalance(
                d.account(), d.credits(), d.expenses(), d.investments(), today, today.plusDays(365));

        return DashboardSummaryResponse.builder()
                .accountId(accountId)
                .currentBalance(d.account().getCurrentBalance())
                .projectedBalance30Days(balance30Days)
                .projectedBalance1Year(balance1Year)
                .calculatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectionResponse calculateProjection(Long accountId, LocalDate targetDate) {
        AccountData d = loadAccountData(accountId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        BigDecimal projectedBalance = calculationEngine.calculateProjectedBalance(
                d.account(), d.credits(), d.expenses(), d.investments(), today, targetDate);

        return ProjectionResponse.builder()
                .accountId(accountId)
                .targetDate(targetDate)
                .projectedBalance(projectedBalance)
                .deltaVariance(projectedBalance.subtract(d.account().getCurrentBalance()))
                .calculatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }

    @Transactional(readOnly = true)
    public FireSummaryResponse getFireSummary(Long accountId) {
        AccountData d = loadAccountData(accountId);

        // ── Monthly income from credits ────────────────────────────────────────
        BigDecimal monthlyIncome = BigDecimal.ZERO;
        for (Credit c : d.credits()) {
            if (c.getRecurrenceInterval() == null) continue;
            monthlyIncome = switch (c.getRecurrenceInterval()) {
                case MONTHLY -> monthlyIncome.add(c.getAmount());
                case ANNUAL  -> monthlyIncome.add(c.getAmount().divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP));
                case WEEKLY  -> monthlyIncome.add(c.getAmount().multiply(BigDecimal.valueOf(4.33)));
            };
        }

        // ── Monthly recurring expenses ─────────────────────────────────────────
        BigDecimal monthlyExpenses = BigDecimal.ZERO;
        for (Expense e : d.expenses()) {
            if (e.getExpenseType() != com.finance.flfp.expense.model.ExpenseType.RECURRING
                    || e.getRecurrenceInterval() == null) continue;
            monthlyExpenses = switch (e.getRecurrenceInterval()) {
                case MONTHLY -> monthlyExpenses.add(e.getAmount());
                case ANNUAL  -> monthlyExpenses.add(e.getAmount().divide(BigDecimal.valueOf(12), 2, java.math.RoundingMode.HALF_UP));
                case WEEKLY  -> monthlyExpenses.add(e.getAmount().multiply(BigDecimal.valueOf(4.33)));
                case DAILY   -> monthlyExpenses.add(e.getAmount().multiply(BigDecimal.valueOf(30)));
                default      -> monthlyExpenses;
            };
        }

        // ── Savings rate ───────────────────────────────────────────────────────
        BigDecimal savingsRate = BigDecimal.ZERO;
        if (monthlyIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = monthlyIncome.subtract(monthlyExpenses)
                    .divide(monthlyIncome, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        // ── FIRE target ────────────────────────────────────────────────────────
        BigDecimal fireTargetNumber = d.account().getFireTargetAmount();
        if (fireTargetNumber == null || fireTargetNumber.compareTo(BigDecimal.ZERO) <= 0) {
            fireTargetNumber = monthlyExpenses.multiply(BigDecimal.valueOf(12))
                    .multiply(BigDecimal.valueOf(25)); // 4% rule
        }

        // ── Current nest egg ───────────────────────────────────────────────────
        BigDecimal currentInvested = d.investments().stream()
                .map(Investment::getInvestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal nestEgg = d.account().getCurrentBalance().add(currentInvested);

        BigDecimal progressPercent = BigDecimal.ZERO;
        if (fireTargetNumber.compareTo(BigDecimal.ZERO) > 0) {
            progressPercent = nestEgg.divide(fireTargetNumber, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        boolean isAchieved = nestEgg.compareTo(fireTargetNumber) >= 0
                && fireTargetNumber.compareTo(BigDecimal.ZERO) > 0;

        // ── FIRE crossover date — binary search instead of linear scan ─────────
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate crossoverDate = null;

        if (isAchieved) {
            crossoverDate = today;
        } else if (fireTargetNumber.compareTo(BigDecimal.ZERO) > 0) {
            crossoverDate = binarySearchCrossover(d, today, fireTargetNumber);
        }

        return FireSummaryResponse.builder()
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

    // ─── Binary search for FIRE crossover date ───────────────────────────────
    /**
     * Replaces the previous O(480) linear scan.
     * Binary searches over [1..480] months to find the first month where the
     * projected balance >= fireTarget.  Worst case: ceil(log2(480)) = 9 iterations.
     */
    private LocalDate binarySearchCrossover(AccountData d, LocalDate today, BigDecimal fireTarget) {
        final int MAX_MONTHS = 480; // 40 years

        // Quick check: is the target reachable at all within 40 years?
        BigDecimal atMax = calculationEngine.calculateProjectedBalance(
                d.account(), d.credits(), d.expenses(), d.investments(), today, today.plusMonths(MAX_MONTHS));
        if (atMax.compareTo(fireTarget) < 0) {
            return null; // Never reached
        }

        int lo = 1, hi = MAX_MONTHS;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            BigDecimal proj = calculationEngine.calculateProjectedBalance(
                    d.account(), d.credits(), d.expenses(), d.investments(), today, today.plusMonths(mid));
            if (proj.compareTo(fireTarget) >= 0) {
                hi = mid;
            } else {
                lo = mid + 1;
            }
        }
        return today.plusMonths(lo);
    }
}
