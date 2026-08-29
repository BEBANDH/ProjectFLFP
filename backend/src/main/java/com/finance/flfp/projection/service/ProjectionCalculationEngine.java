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

        if (!targetDate.isAfter(today)) {
            return account.getCurrentBalance();
        }

        BigDecimal projectedBalance = account.getCurrentBalance();

        // 1. Add Scheduled Inflows (Credits)
        for (Credit credit : credits) {
            long occurrences = DateUtils.computeOccurrences(
                    credit.getStartDate().isBefore(today) ? today.plusDays(1) : credit.getStartDate(), 
                    targetDate, 
                    credit.getRecurrenceInterval().name());
            
            projectedBalance = projectedBalance.add(credit.getAmount().multiply(BigDecimal.valueOf(occurrences), MC));
        }

        // 2. Subtract Scheduled Outflows (Recurring Expenses)
        for (Expense expense : expenses) {
            if (expense.getExpenseType() == ExpenseType.RECURRING) {
                long occurrences = DateUtils.computeOccurrences(
                        expense.getStartDate().isBefore(today) ? today.plusDays(1) : expense.getStartDate(),
                        targetDate,
                        expense.getRecurrenceInterval().name());
                
                projectedBalance = projectedBalance.subtract(expense.getAmount().multiply(BigDecimal.valueOf(occurrences), MC));
            }
        }

        // 3. Process Investments (Outflows and Maturity Yields)
        for (Investment inv : investments) {
            LocalDate effectiveLimit = targetDate;
            if (inv.getMaturityDate() != null && targetDate.isAfter(inv.getMaturityDate())) {
                effectiveLimit = inv.getMaturityDate();
            }

            if (inv.getInvestmentStyle() == InvestmentStyle.SIP) {
                // Deduct SIP outflows
                long sipOccurrences = DateUtils.computeOccurrences(
                        inv.getStartDate().isBefore(today) ? today.plusDays(1) : inv.getStartDate(),
                        effectiveLimit,
                        "MONTHLY");
                projectedBalance = projectedBalance.subtract(inv.getInvestedAmount().multiply(BigDecimal.valueOf(sipOccurrences), MC));

                // Add maturity yield if matured
                if (inv.getMaturityDate() != null && !targetDate.isBefore(inv.getMaturityDate())) {
                    BigDecimal yield = calculateSipFutureValue(inv);
                    projectedBalance = projectedBalance.add(yield, MC);
                }
            } else if (inv.getInvestmentStyle() == InvestmentStyle.ONE_TIME) {
                // Deduct Lumpsum if it happens after today
                if (!inv.getStartDate().isBefore(today) && !inv.getStartDate().isAfter(targetDate)) {
                    projectedBalance = projectedBalance.subtract(inv.getInvestedAmount(), MC);
                }

                // Add maturity yield if matured
                if (inv.getMaturityDate() != null && !targetDate.isBefore(inv.getMaturityDate())) {
                    BigDecimal yield = calculateLumpsumFutureValue(inv);
                    projectedBalance = projectedBalance.add(yield, MC);
                }
            }
        }

        return projectedBalance.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateLumpsumFutureValue(Investment inv) {
        // A = P * (1 + r/100)^t
        long years = ChronoUnit.YEARS.between(inv.getStartDate(), inv.getMaturityDate());
        BigDecimal rate = inv.getRateOfInterest().divide(ONE_HUNDRED, MC);
        BigDecimal base = BigDecimal.ONE.add(rate, MC);
        BigDecimal multiplier = base.pow((int) years, MC);
        return inv.getInvestedAmount().multiply(multiplier, MC);
    }

    private BigDecimal calculateSipFutureValue(Investment inv) {
        // FV = P * [((1 + i)^n - 1) / i] * (1 + i)
        long n = ChronoUnit.MONTHS.between(inv.getStartDate(), inv.getMaturityDate());
        if (n <= 0) return BigDecimal.ZERO;

        BigDecimal i = inv.getRateOfInterest().divide(ONE_HUNDRED, MC).divide(TWELVE, MC);
        BigDecimal onePlusI = BigDecimal.ONE.add(i, MC);
        
        BigDecimal numerator = onePlusI.pow((int) n, MC).subtract(BigDecimal.ONE, MC);
        BigDecimal fraction = numerator.divide(i, MC);
        
        return inv.getInvestedAmount().multiply(fraction, MC).multiply(onePlusI, MC);
    }
}
