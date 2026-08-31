package com.finance.flfp.investment.service;

import com.finance.flfp.account.model.Account;
import com.finance.flfp.account.repository.AccountRepository;
import com.finance.flfp.investment.dto.InvestmentCreateRequest;
import com.finance.flfp.investment.dto.InvestmentResponse;
import com.finance.flfp.investment.model.Investment;
import com.finance.flfp.investment.repository.InvestmentRepository;
import com.finance.flfp.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public InvestmentResponse createInvestment(InvestmentCreateRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        // Validate maturity date constraint
        if (request.getMaturityDate() != null && request.getMaturityDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Maturity date cannot be before start date");
        }

        Investment investment = Investment.builder()
                .account(account)
                .investmentName(request.getInvestmentName())
                .investmentType(request.getInvestmentType())
                .investmentStyle(request.getInvestmentStyle())
                .investedAmount(request.getInvestedAmount())
                .rateOfInterest(request.getRateOfInterest())
                .startDate(request.getStartDate())
                .maturityDate(request.getMaturityDate())
                .isExcludedFromPrincipal(Boolean.TRUE.equals(request.getIsExcludedFromPrincipal()))
                .comments(request.getComments())
                .build();

        Investment savedInvestment = investmentRepository.save(investment);
        return mapToResponse(savedInvestment);
    }

    @Transactional(readOnly = true)
    public List<InvestmentResponse> getInvestmentsByAccountId(Long accountId) {
        return investmentRepository.findByAccountId(accountId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InvestmentResponse updateInvestment(Long investmentId, InvestmentCreateRequest request) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Investment not found with id: " + investmentId));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        if (request.getMaturityDate() != null && request.getMaturityDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Maturity date cannot be before start date");
        }

        investment.setAccount(account);
        investment.setInvestmentName(request.getInvestmentName());
        investment.setInvestmentType(request.getInvestmentType());
        investment.setInvestmentStyle(request.getInvestmentStyle());
        investment.setInvestedAmount(request.getInvestedAmount());
        investment.setRateOfInterest(request.getRateOfInterest());
        investment.setStartDate(request.getStartDate());
        investment.setMaturityDate(request.getMaturityDate());
        investment.setIsExcludedFromPrincipal(Boolean.TRUE.equals(request.getIsExcludedFromPrincipal()));
        investment.setComments(request.getComments());

        Investment updated = investmentRepository.save(investment);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteInvestment(Long investmentId) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Investment not found with id: " + investmentId));
        investmentRepository.delete(investment);
    }

    private InvestmentResponse mapToResponse(Investment investment) {
        return InvestmentResponse.builder()
                .id(investment.getId())
                .accountId(investment.getAccount().getId())
                .investmentName(investment.getInvestmentName())
                .investmentType(investment.getInvestmentType())
                .investmentStyle(investment.getInvestmentStyle())
                .investedAmount(investment.getInvestedAmount())
                .rateOfInterest(investment.getRateOfInterest())
                .startDate(investment.getStartDate())
                .maturityDate(investment.getMaturityDate())
                .isExcludedFromPrincipal(investment.getIsExcludedFromPrincipal())
                .comments(investment.getComments())
                .createdAt(investment.getCreatedAt())
                .build();
    }
}
