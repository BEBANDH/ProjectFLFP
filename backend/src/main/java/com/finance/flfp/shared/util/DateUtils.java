package com.finance.flfp.shared.util;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;

public class DateUtils {

    /**
     * Calculates the effective target date resolving month-end overshoots (e.g., Feb 30th -> Feb 28/29th).
     */
    public static LocalDate resolveOvershoot(LocalDate startDate, LocalDate targetDate) {
        int startDay = startDate.getDayOfMonth();
        int maxDaysInTargetMonth = YearMonth.from(targetDate).lengthOfMonth();
        
        int effectiveDay = Math.min(startDay, maxDaysInTargetMonth);
        return targetDate.withDayOfMonth(effectiveDay);
    }

    /**
     * Computes the number of recurrences between two dates based on an interval string.
     */
    public static long computeOccurrences(LocalDate start, LocalDate end, String interval) {
        if (start.isAfter(end) || "NONE".equalsIgnoreCase(interval)) {
            return 0;
        }

        return switch (interval.toUpperCase()) {
            case "DAILY" -> ChronoUnit.DAYS.between(start, end) + 1;
            case "WEEKLY" -> ChronoUnit.WEEKS.between(start, end) + 1;
            case "MONTHLY" -> ChronoUnit.MONTHS.between(start, end) + 1;
            case "ANNUAL" -> ChronoUnit.YEARS.between(start, end) + 1;
            default -> 0;
        };
    }
}
