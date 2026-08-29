package com.finance.flfp.investment.controller;

import com.finance.flfp.investment.dto.InvestmentCreateRequest;
import com.finance.flfp.investment.dto.InvestmentResponse;
import com.finance.flfp.investment.service.InvestmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentService investmentService;

    @PostMapping
    public ResponseEntity<InvestmentResponse> createInvestment(@Valid @RequestBody InvestmentCreateRequest request) {
        InvestmentResponse response = investmentService.createInvestment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<InvestmentResponse>> getInvestmentsByAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(investmentService.getInvestmentsByAccountId(accountId));
    }

    @DeleteMapping("/{investmentId}")
    public ResponseEntity<Void> deleteInvestment(@PathVariable Long investmentId) {
        investmentService.deleteInvestment(investmentId);
        return ResponseEntity.noContent().build();
    }
}
