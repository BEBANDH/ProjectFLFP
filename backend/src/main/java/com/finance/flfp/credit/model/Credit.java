package com.finance.flfp.credit.model;

import com.finance.flfp.account.model.Account;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "credits", indexes = @Index(name = "idx_credit_account_id", columnList = "account_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Credit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "source_name", nullable = false, length = 100)
    private String sourceName;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_interval", nullable = false)
    private CreditInterval recurrenceInterval;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "growth_percentage", precision = 5, scale = 2)
    private BigDecimal growthPercentage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
