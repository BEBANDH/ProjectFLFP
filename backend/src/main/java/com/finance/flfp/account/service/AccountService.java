package com.finance.flfp.account.service;

import com.finance.flfp.account.dto.AccountCreateRequest;
import com.finance.flfp.account.dto.AccountResponse;
import com.finance.flfp.account.dto.AccountUpdateRequest;
import com.finance.flfp.account.model.Account;
import com.finance.flfp.account.repository.AccountRepository;
import com.finance.flfp.shared.exception.ResourceNotFoundException;
import com.finance.flfp.user.model.User;
import com.finance.flfp.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public AccountResponse createAccount(AccountCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Account account = Account.builder()
                .user(user)
                .accountName(request.getAccountName())
                .bankName(request.getBankName())
                .currentBalance(request.getCurrentBalance())
                .build();

        Account savedAccount = accountRepository.save(account);
        return mapToResponse(savedAccount);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return accountRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Long accountId) {
        Account account = getAccountEntityById(accountId);
        return mapToResponse(account);
    }

    @Transactional
    public void deleteAccount(Long accountId) {
        Account account = getAccountEntityById(accountId);
        accountRepository.delete(account);
    }

    @Transactional
    public AccountResponse updateAccount(Long accountId, AccountUpdateRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + accountId));

        account.setAccountName(request.getAccountName());
        account.setBankName(request.getBankName());
        account.setCurrentBalance(request.getCurrentBalance());

        Account updatedAccount = accountRepository.save(account);
        return mapToResponse(updatedAccount);
    }

    private Account getAccountEntityById(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + accountId));
    }

    private AccountResponse mapToResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .userId(account.getUser().getId())
                .accountName(account.getAccountName())
                .bankName(account.getBankName())
                .currentBalance(account.getCurrentBalance())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
