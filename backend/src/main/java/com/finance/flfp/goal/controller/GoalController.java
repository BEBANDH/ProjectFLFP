package com.finance.flfp.goal.controller;

import com.finance.flfp.goal.dto.GoalCreateRequest;
import com.finance.flfp.goal.dto.GoalResponse;
import com.finance.flfp.goal.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(@Valid @RequestBody GoalCreateRequest request) {
        return new ResponseEntity<>(goalService.createGoal(request), HttpStatus.CREATED);
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<GoalResponse>> getGoalsByAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(goalService.getGoalsByAccountId(accountId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(@PathVariable Long id, @Valid @RequestBody GoalCreateRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id) {
        goalService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }
}
