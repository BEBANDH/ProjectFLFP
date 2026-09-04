package com.finance.flfp.credit.service;

import com.finance.flfp.account.model.Account;
import com.finance.flfp.account.repository.AccountRepository;
import com.finance.flfp.credit.dto.CreditCreateRequest;
import com.finance.flfp.credit.dto.CreditResponse;
import com.finance.flfp.credit.model.Credit;
import com.finance.flfp.credit.repository.CreditRepository;
import com.finance.flfp.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CreditService {

    private final CreditRepository creditRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public CreditResponse createCredit(CreditCreateRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        Credit credit = Credit.builder()
                .account(account)
                .sourceName(request.getSourceName())
                .amount(request.getAmount())
                .recurrenceInterval(request.getRecurrenceInterval())
                .startDate(request.getStartDate())
                .growthPercentage(request.getGrowthPercentage())
                .build();

        Credit savedCredit = creditRepository.save(credit);
        return mapToResponse(savedCredit);
    }

    @Transactional(readOnly = true)
    public List<CreditResponse> getCreditsByAccountId(Long accountId) {
        return creditRepository.findByAccountId(accountId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CreditResponse updateCredit(Long creditId, CreditCreateRequest request) {
        Credit credit = creditRepository.findById(creditId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit not found with id: " + creditId));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        credit.setAccount(account);
        credit.setSourceName(request.getSourceName());
        credit.setAmount(request.getAmount());
        credit.setRecurrenceInterval(request.getRecurrenceInterval());
        credit.setStartDate(request.getStartDate());
        credit.setGrowthPercentage(request.getGrowthPercentage());

        Credit updated = creditRepository.save(credit);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteCredit(Long creditId) {
        Credit credit = creditRepository.findById(creditId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit not found with id: " + creditId));
        creditRepository.delete(credit);
    }

    private CreditResponse mapToResponse(Credit credit) {
        return CreditResponse.builder()
                .id(credit.getId())
                .accountId(credit.getAccount().getId())
                .sourceName(credit.getSourceName())
                .amount(credit.getAmount())
                .recurrenceInterval(credit.getRecurrenceInterval())
                .startDate(credit.getStartDate())
                .growthPercentage(credit.getGrowthPercentage())
                .createdAt(credit.getCreatedAt())
                .build();
    }
}
