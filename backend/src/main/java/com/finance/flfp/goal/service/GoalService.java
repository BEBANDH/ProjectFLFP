package com.finance.flfp.goal.service;

import com.finance.flfp.account.model.Account;
import com.finance.flfp.account.repository.AccountRepository;
import com.finance.flfp.goal.dto.GoalCreateRequest;
import com.finance.flfp.goal.dto.GoalResponse;
import com.finance.flfp.goal.model.Goal;
import com.finance.flfp.goal.repository.GoalRepository;
import com.finance.flfp.projection.service.ProjectionCalculationEngine;
import com.finance.flfp.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final AccountRepository accountRepository;
    private final ProjectionCalculationEngine calculationEngine;

    @Transactional
    public GoalResponse createGoal(GoalCreateRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        Goal goal = Goal.builder()
                .account(account)
                .goalName(request.getGoalName())
                .targetAmount(request.getTargetAmount())
                .targetDate(request.getTargetDate())
                .notes(request.getNotes())
                .build();

        Goal savedGoal = goalRepository.save(goal);
        return mapToResponse(savedGoal);
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getGoalsByAccountId(Long accountId) {
        return goalRepository.findByAccountId(accountId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GoalResponse updateGoal(Long goalId, GoalCreateRequest request) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with id: " + request.getAccountId()));

        goal.setAccount(account);
        goal.setGoalName(request.getGoalName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setTargetDate(request.getTargetDate());
        goal.setNotes(request.getNotes());

        Goal updated = goalRepository.save(goal);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteGoal(Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));
        goalRepository.delete(goal);
    }

    private final com.finance.flfp.credit.repository.CreditRepository creditRepository;
    private final com.finance.flfp.expense.repository.ExpenseRepository expenseRepository;
    private final com.finance.flfp.investment.repository.InvestmentRepository investmentRepository;

    private GoalResponse mapToResponse(Goal goal) {
        List<com.finance.flfp.credit.model.Credit> credits = creditRepository.findByAccountId(goal.getAccount().getId());
        List<com.finance.flfp.expense.model.Expense> expenses = expenseRepository.findByAccountId(goal.getAccount().getId());
        List<com.finance.flfp.investment.model.Investment> investments = investmentRepository.findByAccountId(goal.getAccount().getId());
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);

        BigDecimal projectedAtDate = calculationEngine.calculateProjectedBalance(
                goal.getAccount(), credits, expenses, investments, today, goal.getTargetDate());
        boolean isOnTrack = projectedAtDate.compareTo(goal.getTargetAmount()) >= 0;

        return GoalResponse.builder()
                .id(goal.getId())
                .accountId(goal.getAccount().getId())
                .goalName(goal.getGoalName())
                .targetAmount(goal.getTargetAmount())
                .targetDate(goal.getTargetDate())
                .notes(goal.getNotes())
                .currentProjectedAmount(projectedAtDate)
                .isOnTrack(isOnTrack)
                .createdAt(goal.getCreatedAt())
                .build();
    }
}
