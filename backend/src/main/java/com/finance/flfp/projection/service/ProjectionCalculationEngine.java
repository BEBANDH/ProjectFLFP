package com.finance.flfp.projection.service;

import com.finance.flfp.account.model.Account;
import com.finance.flfp.credit.model.Credit;
import com.finance.flfp.expense.model.Expense;
import com.finance.flfp.expense.model.ExpenseType;
import com.finance.flfp.investment.model.Investment;
import com.finance.flfp.investment.model.InvestmentStyle;
import com.finance.flfp.shared.util.DateUtils;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class ProjectionCalculationEngine {

    private static final MathContext MC = MathContext.DECIMAL128;
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal TWELVE = new BigDecimal("12");

    public BigDecimal calculateProjectedBalance(
            Account account,
            List<Credit> credits,
            List<Expense> expenses,
            List<Investment> investments,
            LocalDate today,
            LocalDate targetDate) {

        if (account == null || account.getCurrentBalance() == null) {
            return BigDecimal.ZERO;
        }

        if (targetDate == null || !targetDate.isAfter(today)) {
            return account.getCurrentBalance();
        }

        BigDecimal projectedBalance = account.getCurrentBalance();

        // 1. Add Scheduled Inflows (Credits)
        if (credits != null) {
            for (Credit credit : credits) {
                if (credit.getAmount() == null || credit.getStartDate() == null || credit.getRecurrenceInterval() == null) {
                    continue;
                }
                LocalDate creditOrigin = credit.getStartDate();
                LocalDate start = creditOrigin.isBefore(today) ? today.plusDays(1) : creditOrigin;
                if (start.isAfter(targetDate)) {
                    continue;
                }

                BigDecimal growthRate = credit.getGrowthPercentage();
                boolean hasGrowth = growthRate != null && growthRate.compareTo(BigDecimal.ZERO) > 0;

                if (!hasGrowth) {
                    long occurrences = DateUtils.computeOccurrences(start, targetDate, credit.getRecurrenceInterval().name());
                    projectedBalance = projectedBalance.add(credit.getAmount().multiply(BigDecimal.valueOf(occurrences), MC));
                } else {
                    BigDecimal totalInflow = BigDecimal.ZERO;
                    double rate = growthRate.doubleValue() / 100.0;
                    LocalDate current = start;

                    while (!current.isAfter(targetDate)) {
                        long completedYears = ChronoUnit.YEARS.between(creditOrigin, current);
                        double factor = Math.pow(1.0 + rate, completedYears);
                        BigDecimal adjustedAmount = credit.getAmount().multiply(BigDecimal.valueOf(factor), MC);
                        totalInflow = totalInflow.add(adjustedAmount, MC);

                        current = switch (credit.getRecurrenceInterval()) {
                            case WEEKLY -> current.plusWeeks(1);
                            case MONTHLY -> current.plusMonths(1);
                            case ANNUAL -> current.plusYears(1);
                        };
                    }
                    projectedBalance = projectedBalance.add(totalInflow, MC);
                }
            }
        }

        // 2. Subtract Scheduled Outflows (Recurring Expenses)
        if (expenses != null) {
            for (Expense expense : expenses) {
                if (expense.getAmount() == null || expense.getStartDate() == null || expense.getExpenseType() == null) {
                    continue;
                }
                if (expense.getExpenseType() == ExpenseType.RECURRING && expense.getRecurrenceInterval() != null) {
                    LocalDate start = expense.getStartDate().isBefore(today) ? today.plusDays(1) : expense.getStartDate();
                    long occurrences = DateUtils.computeOccurrences(start, targetDate, expense.getRecurrenceInterval().name());
                    projectedBalance = projectedBalance.subtract(expense.getAmount().multiply(BigDecimal.valueOf(occurrences), MC));
                }
            }
        }

        // 3. Process Investments (Outflows and Maturity Yields)
        if (investments != null) {
            for (Investment inv : investments) {
                if (inv.getInvestedAmount() == null || inv.getStartDate() == null || inv.getInvestmentStyle() == null) {
                    continue;
                }

                LocalDate effectiveLimit = targetDate;
                if (inv.getMaturityDate() != null && targetDate.isAfter(inv.getMaturityDate())) {
                    effectiveLimit = inv.getMaturityDate();
                }

                boolean isExcluded = Boolean.TRUE.equals(inv.getIsExcludedFromPrincipal());

                if (inv.getInvestmentStyle() == InvestmentStyle.SIP) {
                    if (!isExcluded) {
                        LocalDate sipStart = inv.getStartDate().isBefore(today) ? today.plusDays(1) : inv.getStartDate();
                        if (!sipStart.isAfter(effectiveLimit)) {
                            long sipOccurrences = DateUtils.computeOccurrences(
                                    sipStart,
                                    effectiveLimit,
                                    "MONTHLY");
                            projectedBalance = projectedBalance.subtract(inv.getInvestedAmount().multiply(BigDecimal.valueOf(sipOccurrences), MC));
                        }
                    }

                    if (inv.getMaturityDate() != null && !targetDate.isBefore(inv.getMaturityDate())) {
                        BigDecimal maturityYield = calculateSipFutureValue(inv);
                        projectedBalance = projectedBalance.add(maturityYield, MC);
                    }
                } else if (inv.getInvestmentStyle() == InvestmentStyle.ONE_TIME) {
                    if (!isExcluded) {
                        if (!inv.getStartDate().isBefore(today) && !inv.getStartDate().isAfter(targetDate)) {
                            projectedBalance = projectedBalance.subtract(inv.getInvestedAmount(), MC);
                        }
                    }

                    if (inv.getMaturityDate() != null && !targetDate.isBefore(inv.getMaturityDate())) {
                        BigDecimal maturityYield = calculateLumpsumFutureValue(inv);
                        projectedBalance = projectedBalance.add(maturityYield, MC);
                    }
                }
            }
        }

        return projectedBalance.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateLumpsumFutureValue(Investment inv) {
        if (inv == null || inv.getInvestedAmount() == null) {
            return BigDecimal.ZERO;
        }

        if (inv.getMaturityDate() == null || inv.getStartDate() == null || inv.getMaturityDate().isBefore(inv.getStartDate())) {
            return inv.getInvestedAmount();
        }

        double days = ChronoUnit.DAYS.between(inv.getStartDate(), inv.getMaturityDate());
        if (days <= 0) {
            return inv.getInvestedAmount();
        }

        double tYears = days / 365.25;
        double rate = inv.getRateOfInterest() != null ? inv.getRateOfInterest().doubleValue() / 100.0 : 0.0;
        double multiplier = Math.pow(1.0 + rate, tYears);

        return inv.getInvestedAmount().multiply(BigDecimal.valueOf(multiplier), MC);
    }

    private BigDecimal calculateSipFutureValue(Investment inv) {
        if (inv == null || inv.getInvestedAmount() == null) {
            return BigDecimal.ZERO;
        }

        if (inv.getMaturityDate() == null || inv.getStartDate() == null || inv.getMaturityDate().isBefore(inv.getStartDate())) {
            return BigDecimal.ZERO;
        }

        double days = ChronoUnit.DAYS.between(inv.getStartDate(), inv.getMaturityDate());
        if (days <= 0) {
            return inv.getInvestedAmount();
        }

        int n = (int) Math.max(1, Math.round(days / 30.4375));

        double rate = inv.getRateOfInterest() != null ? inv.getRateOfInterest().doubleValue() : 0.0;
        if (rate <= 0.0001) {
            return inv.getInvestedAmount().multiply(BigDecimal.valueOf(n), MC);
        }

        BigDecimal i = BigDecimal.valueOf(rate).divide(ONE_HUNDRED, MC).divide(TWELVE, MC);
        BigDecimal onePlusI = BigDecimal.ONE.add(i, MC);

        BigDecimal numerator = onePlusI.pow(n, MC).subtract(BigDecimal.ONE, MC);
        BigDecimal fraction = numerator.divide(i, MC);

        return inv.getInvestedAmount().multiply(fraction, MC).multiply(onePlusI, MC);
    }
}
