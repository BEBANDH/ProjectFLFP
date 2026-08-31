package com.finance.flfp.account.controller;

import com.finance.flfp.account.dto.AccountCreateRequest;
import com.finance.flfp.account.dto.AccountResponse;
import com.finance.flfp.account.dto.AccountUpdateRequest;
import com.finance.flfp.account.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody AccountCreateRequest request) {
        AccountResponse response = accountService.createAccount(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my-accounts")
    public ResponseEntity<List<AccountResponse>> getAccountsByUser() {
        return ResponseEntity.ok(accountService.getAccountsForCurrentUser());
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<AccountResponse> getAccountById(@PathVariable Long accountId) {
        return ResponseEntity.ok(accountService.getAccountById(accountId));
    }
    
    @PutMapping("/{accountId}")
    public ResponseEntity<AccountResponse> updateAccount(@PathVariable Long accountId, @Valid @RequestBody AccountUpdateRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(accountId, request));
    }

    @DeleteMapping("/{accountId}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long accountId) {
        accountService.deleteAccount(accountId);
        return ResponseEntity.noContent().build();
    }
}
