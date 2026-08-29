package com.finance.flfp.credit.controller;

import com.finance.flfp.credit.dto.CreditCreateRequest;
import com.finance.flfp.credit.dto.CreditResponse;
import com.finance.flfp.credit.service.CreditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credits")
@RequiredArgsConstructor
public class CreditController {

    private final CreditService creditService;

    @PostMapping
    public ResponseEntity<CreditResponse> createCredit(@Valid @RequestBody CreditCreateRequest request) {
        CreditResponse response = creditService.createCredit(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<CreditResponse>> getCreditsByAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(creditService.getCreditsByAccountId(accountId));
    }

    @DeleteMapping("/{creditId}")
    public ResponseEntity<Void> deleteCredit(@PathVariable Long creditId) {
        creditService.deleteCredit(creditId);
        return ResponseEntity.noContent().build();
    }
}
