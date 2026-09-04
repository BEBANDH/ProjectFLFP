import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountStateService } from '../../../core/services/account-state.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ExportService } from '../../../core/services/export.service';
import { ProjectionService } from '../services/projection.service';
import { ProjectionResponse, DashboardSummaryResponse, FireSummaryResponse, GoalResponse, GoalCreateRequest, GoalUpdateRequest } from '../../../shared/models/common-api.models';
import { ProjectionChartComponent } from '../components/projection-chart/projection-chart.component';
import { AssetAllocationChartComponent } from '../components/asset-allocation-chart/asset-allocation-chart.component';
import { PortfolioModalComponent } from '../../../shared/components/portfolio-modal/portfolio-modal.component';
import { PortfolioWizardComponent } from '../../../shared/components/portfolio-wizard/portfolio-wizard.component';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProjectionChartComponent,
    AssetAllocationChartComponent,
    PortfolioModalComponent,
    PortfolioWizardComponent
  ],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div>
          <h1>Financial Projection & Freedom Engine</h1>
          <p class="subtitle">Real-time compounding trajectory, FIRE crossover & milestone tracking</p>
        </div>
        <div class="header-actions">
          <button class="export-report-btn excel-btn" (click)="exportExcelData()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
            Export Excel
          </button>
          <button class="export-report-btn" (click)="exportReport()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Export PDF Statement
          </button>
        </div>
      </header>

      <div class="content-grid" *ngIf="summary && accountState.activeAccountId()">
        
        <!-- FIRE & Financial Freedom Intelligence Banner -->
        <div class="fire-intelligence-card" *ngIf="fireSummary">
          <div class="fire-header">
            <div class="fire-title-group">
              <div class="fire-badge">FIRE Freedom Intelligence</div>
              <h2>Financial Independence & Retire Early</h2>
            </div>
            <div class="savings-rate-pill">
              <span>Savings Rate:</span>
              <strong>{{ fireSummary.savingsRatePercent | number:'1.0-1' }}%</strong>
            </div>
          </div>

          <div class="fire-metrics-grid">
            <div class="fire-metric">
              <span class="metric-label">Target FIRE Nest Egg (4% Rule)</span>
              <span class="metric-value">{{ fireSummary.fireTargetNumber | currency:settings.currencyCode() }}</span>
              <span class="metric-sub font-muted">25x Annualized Expenses</span>
            </div>

            <div class="fire-metric">
              <span class="metric-label">Current Nest Egg</span>
              <span class="metric-value accent-text">{{ fireSummary.currentPortfolioNestEgg | currency:settings.currencyCode() }}</span>
              <span class="metric-sub font-muted">Baseline + Investments</span>
            </div>

            <div class="fire-metric">
              <span class="metric-label">Predicted FIRE Crossover Date</span>
              <span class="metric-value positive-text" *ngIf="fireSummary.fireCrossoverDate">
                {{ fireSummary.fireCrossoverDate | date:'MMM yyyy' }}
              </span>
              <span class="metric-value negative-text" *ngIf="!fireSummary.fireCrossoverDate">
                Increase Savings
              </span>
              <span class="metric-sub font-muted" *ngIf="fireSummary.isFireAchieved">🎉 Freedom Achieved!</span>
              <span class="metric-sub font-muted" *ngIf="!fireSummary.isFireAchieved">Passive income exceeds expenses</span>
            </div>
          </div>

          <div class="fire-progress-bar-container">
            <div class="progress-labels">
              <span>FIRE Progress</span>
              <strong>{{ fireSummary.fireProgressPercent | number:'1.0-1' }}%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="fireSummary.fireProgressPercent > 100 ? 100 : fireSummary.fireProgressPercent"></div>
            </div>
          </div>
        </div>

        <!-- Bento Grid Top Section -->
        <div class="bento-grid">
          <!-- Card 1: Baseline -->
          <div class="bento-card baseline-card">
            <div class="bento-card-header">
              <div class="bento-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <span class="bento-title">Current Baseline</span>
            </div>
            <div class="bento-amount">{{ summary.currentBalance | currency:settings.currencyCode() }}</div>
            <div class="bento-subtext">Active account cash balance</div>
          </div>

          <!-- Card 2: +30 Days -->
          <div class="bento-card projection-card">
            <div class="bento-card-header">
              <div class="bento-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <span class="bento-title">+30 Days Projection</span>
            </div>
            <div class="bento-amount">{{ summary.projectedBalance30Days | currency:settings.currencyCode() }}</div>
            <div class="bento-subtext">Short-term liquidity forecast</div>
          </div>

          <!-- Card 3: +365 Days -->
          <div class="bento-card projection-card">
            <div class="bento-card-header">
              <div class="bento-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
              <span class="bento-title">+1 Year Projection</span>
            </div>
            <div class="bento-amount">{{ summary.projectedBalance1Year | currency:settings.currencyCode() }}</div>
            <div class="bento-subtext">Compounded annual growth</div>
          </div>

          <!-- Card 4: Interactive Target Date Simulator Stat -->
          <div class="bento-card simulator-bento-card">
            <div class="bento-card-header">
              <div class="bento-icon accent-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <span class="bento-title">Target Date Simulator</span>
            </div>
            
            <div class="simulator-controls">
              <input type="date" [(ngModel)]="targetDate" (change)="runSimulation()" class="date-picker">
            </div>
            
            <div class="simulator-result" *ngIf="customProjection">
              <div class="bento-amount highlight">{{ customProjection.projectedBalance | currency:settings.currencyCode() }}</div>
              <div class="variance-tag" [ngClass]="{'positive': customProjection.deltaVariance >= 0, 'negative': customProjection.deltaVariance < 0}">
                {{ customProjection.deltaVariance > 0 ? '+' : '' }}{{ customProjection.deltaVariance | currency:settings.currencyCode() }} (Δ)
              </div>
            </div>
          </div>
        </div>
        
        <!-- Interactive Chart & Asset Allocation Grid -->
        <div class="charts-double-grid">
          <div class="chart-section card">
            <div class="chart-header">
              <div class="chart-title-group">
                <h3>Wealth Trajectory</h3>
                <button 
                  class="inflation-toggle-btn" 
                  [class.active]="adjustForInflation" 
                  (click)="toggleInflation()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                  {{ adjustForInflation ? 'Inflation Adjusted (5% CPI)' : 'Nominal Wealth' }}
                </button>
              </div>
              <div class="time-filters">
                <button [class.active]="projectionMonths === 6" (click)="setProjectionTime(6)">6M</button>
                <button [class.active]="projectionMonths === 12" (click)="setProjectionTime(12)">1Y</button>
                <button [class.active]="projectionMonths === 36" (click)="setProjectionTime(36)">3Y</button>
                <button [class.active]="projectionMonths === 60" (click)="setProjectionTime(60)">5Y</button>
              </div>
            </div>
            <app-projection-chart 
              [labels]="chartLabels" 
              [data]="displayChartData"
              [fireTargetNumber]="fireSummary?.fireTargetNumber || null">
            </app-projection-chart>
          </div>

          <app-asset-allocation-chart [investments]="investments"></app-asset-allocation-chart>
        </div>

        <!-- Financial Goals & Milestone Planner Section -->
        <div class="goals-section card">
          <div class="goals-header">
            <div class="goals-title-group">
              <div class="goals-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              </div>
              <div>
                <h3>Financial Goals & Milestones</h3>
                <p class="subtitle">Set targets and verify if your portfolio is on track</p>
              </div>
            </div>
            <button class="btn-primary" (click)="showGoalForm = !showGoalForm">
              {{ showGoalForm ? 'Cancel' : '+ Add Goal' }}
            </button>
          </div>

          <!-- Add Goal Form -->
          <div class="goal-form-container" *ngIf="showGoalForm">
            <form (ngSubmit)="createGoal()" class="goal-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Goal Name</label>
                  <input type="text" [(ngModel)]="newGoal.goalName" name="goalName" placeholder="e.g. Buy a House" required>
                </div>
                <div class="form-group">
                  <label>Target Amount ({{ settings.currencyCode() }})</label>
                  <input type="number" [(ngModel)]="newGoal.targetAmount" name="targetAmount" placeholder="50000" required>
                </div>
                <div class="form-group">
                  <label>Target Date</label>
                  <input type="date" [(ngModel)]="newGoal.targetDate" name="targetDate" required>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary">Save Milestone Goal</button>
              </div>
            </form>
          </div>

          <!-- Goals Cards Grid -->
          <div class="goals-grid">
            <div *ngIf="goals.length === 0" class="no-goals-text">
              No financial goals set yet. Add a target goal (e.g. House Down Payment, Retirement) to track progress!
            </div>
            <div *ngFor="let goal of goals" class="goal-card" [class.on-track]="goal.isOnTrack" [class.off-track]="!goal.isOnTrack">
              <div class="goal-card-header">
                <span class="goal-name">{{ goal.goalName }}</span>
                <span class="track-badge" [ngClass]="goal.isOnTrack ? 'on-track-badge' : 'off-track-badge'">
                  {{ goal.isOnTrack ? '✓ On Track' : '⚠️ Action Needed' }}
                </span>
              </div>

              <!-- Edit Goal Form Inline -->
              <div *ngIf="editingGoalId === goal.id" class="edit-goal-box">
                <input type="text" [(ngModel)]="editGoalData.goalName" placeholder="Goal Name" class="mini-input">
                <input type="number" [(ngModel)]="editGoalData.targetAmount" placeholder="Target Amount" class="mini-input">
                <input type="date" [(ngModel)]="editGoalData.targetDate" class="mini-input">
                <div class="edit-actions">
                  <button class="btn-primary mini-btn" (click)="saveGoalEdit(goal.id)">Save</button>
                  <button class="btn-secondary mini-btn" (click)="editingGoalId = null">Cancel</button>
                </div>
              </div>

              <div *ngIf="editingGoalId !== goal.id">
                <div class="goal-amount-row">
                  <span class="target-val">{{ goal.targetAmount | currency:settings.currencyCode() }}</span>
                  <span class="goal-date">Target: {{ goal.targetDate | date:'MMM yyyy' }}</span>
                </div>
                <div class="goal-projected-sub">
                  Projected: <strong>{{ goal.currentProjectedAmount | currency:settings.currencyCode() }}</strong>
                </div>
                <div class="time-to-reach-tag">
                  ⏱️ {{ getTimeToReachText(goal.targetDate) }}
                </div>
                <div class="card-btn-row">
                  <button class="edit-goal-btn" (click)="startEditGoal(goal)">Edit</button>
                  <button class="delete-goal-btn" (click)="deleteGoal(goal.id)">Remove</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Portfolio Assets & Cashflows Bento Grid -->
        <div class="assets-bento-grid">
          <!-- Bento Card 1: Credits & Income -->
          <div class="bento-detail-card credits-bento-card">
            <div class="bento-detail-header">
              <div class="bento-detail-icon positive-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <span class="bento-detail-title">Income & Credits</span>
              <span class="count-pill">{{ credits.length }}</span>
            </div>
            <div class="bento-detail-body">
              <div *ngIf="credits.length === 0" class="bento-empty-text">No active credits</div>
              <ul class="bento-item-list" *ngIf="credits.length > 0">
                <li *ngFor="let item of credits" class="bento-item">
                  <div class="item-main">
                    <span class="item-name">{{ item.sourceName }}</span>
                    <span class="item-sub">{{ item.recurrenceInterval }}</span>
                  </div>
                  <span class="item-amount positive-val">+{{ item.amount | currency:settings.currencyCode() }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Bento Card 2: Expenses & Outflows -->
          <div class="bento-detail-card expenses-bento-card">
            <div class="bento-detail-header">
              <div class="bento-detail-icon negative-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <span class="bento-detail-title">Expenses</span>
              <span class="count-pill">{{ expenses.length }}</span>
            </div>
            <div class="bento-detail-body">
              <div *ngIf="expenses.length === 0" class="bento-empty-text">No logged expenses</div>
              <ul class="bento-item-list" *ngIf="expenses.length > 0">
                <li *ngFor="let item of expenses" class="bento-item">
                  <div class="item-main">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-sub">{{ item.expenseType === 'RECURRING' ? item.recurrenceInterval : 'INSTANT' }}</span>
                  </div>
                  <span class="item-amount negative-val">-{{ item.amount | currency:settings.currencyCode() }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Bento Card 3: Investments & Growth Vehicles -->
          <div class="bento-detail-card investments-bento-card">
            <div class="bento-detail-header">
              <div class="bento-detail-icon accent-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
              <span class="bento-detail-title">Investments</span>
              <span class="count-pill">{{ investments.length }}</span>
            </div>
            <div class="bento-detail-body">
              <div *ngIf="investments.length === 0" class="bento-empty-text">No active investments</div>
              <ul class="bento-item-list" *ngIf="investments.length > 0">
                <li *ngFor="let item of investments" class="bento-item flex-column-item">
                  <div class="item-header-row">
                    <span class="item-name">{{ item.investmentName }}</span>
                    <span class="item-amount accent-val">{{ item.investedAmount | currency:settings.currencyCode() }}</span>
                  </div>
                  <div class="item-tags-row">
                    <span class="mini-tag style-tag">{{ item.investmentStyle }}</span>
                    <span class="mini-tag rate-tag">&#64; {{ item.rateOfInterest }}%</span>
                    <span class="mini-tag excluded-tag" *ngIf="item.isExcludedFromPrincipal">Excluded from Base Amount</span>
                  </div>
                </li>
              </ul>
            </div>
        </div>
      </div> <!-- End content-grid -->

      <!-- Print-Only Executive Financial Statement & Report -->
      <div class="print-only-report" *ngIf="summary && accountState.activeAccountId()">
          <div class="print-header">
            <div class="print-brand">
              <h2>FINANCIAL LIFE PLANNING & PROJECTION STATEMENT</h2>
              <p class="print-sub">Comprehensive Portfolio Analysis & Cashflow Audit</p>
            </div>
            <div class="print-meta">
              <div><strong>Portfolio:</strong> {{ activePortfolioName }}</div>
              <div><strong>Institution:</strong> {{ activePortfolioBank }}</div>
              <div><strong>Statement Date:</strong> {{ todayDate | date:'fullDate' }}</div>
              <div><strong>Base Currency:</strong> {{ settings.currencyCode() }}</div>
            </div>
          </div>

          <!-- Executive Financial Summary Table -->
          <div class="print-section">
            <h3>1. Executive Summary & FIRE Intelligence</h3>
            <table class="print-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Current Value</th>
                  <th>Key Insight / Projection</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Liquid Baseline Balance</td>
                  <td>{{ summary?.currentBalance | currency:settings.currencyCode() }}</td>
                  <td>Current cash/bank balance</td>
                </tr>
                <tr>
                  <td>Total Invested Assets</td>
                  <td>{{ (fireSummary?.currentPortfolioNestEgg || 0) - (summary?.currentBalance || 0) | currency:settings.currencyCode() }}</td>
                  <td>Compounding investment capital</td>
                </tr>
                <tr>
                  <td>Net Portfolio Nest Egg</td>
                  <td>{{ fireSummary?.currentPortfolioNestEgg | currency:settings.currencyCode() }}</td>
                  <td>Liquid Balance + Investments</td>
                </tr>
                <tr>
                  <td>Monthly Recurring Income</td>
                  <td>{{ fireSummary?.monthlyIncome | currency:settings.currencyCode() }}</td>
                  <td>Aggregated active/passive inflows</td>
                </tr>
                <tr>
                  <td>Monthly Recurring Expenses</td>
                  <td>{{ fireSummary?.monthlyExpenses | currency:settings.currencyCode() }}</td>
                  <td>Aggregated obligations</td>
                </tr>
                <tr>
                  <td>Monthly Savings Rate</td>
                  <td>{{ fireSummary?.savingsRatePercent | number:'1.0-1' }}%</td>
                  <td>Surplus ratio reinvested</td>
                </tr>
                <tr>
                  <td>FIRE Target Nest Egg</td>
                  <td>{{ fireSummary?.fireTargetNumber | currency:settings.currencyCode() }}</td>
                  <td>Target threshold</td>
                </tr>
                <tr>
                  <td>FIRE Freedom Date</td>
                  <td>{{ fireSummary?.fireCrossoverDate ? (fireSummary?.fireCrossoverDate | date:'MMM yyyy') : 'Pending Growth' }}</td>
                  <td>{{ fireSummary?.isFireAchieved ? '🎉 Freedom Achieved' : 'Crossover point prediction' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Active Investments Table -->
          <div class="print-section">
            <h3>2. Active Investments Breakdown</h3>
            <table class="print-table" *ngIf="investments.length > 0">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Type / Style</th>
                  <th>Invested Amount</th>
                  <th>Interest Rate</th>
                  <th>Start Date</th>
                  <th>Principal Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of investments">
                  <td><strong>{{ inv.investmentName }}</strong></td>
                  <td>{{ inv.investmentStyle }} ({{ inv.investmentType }})</td>
                  <td>{{ inv.investedAmount | currency:settings.currencyCode() }}</td>
                  <td>{{ inv.rateOfInterest }}% p.a.</td>
                  <td>{{ inv.startDate | date:'mediumDate' }}</td>
                  <td>{{ inv.isExcludedFromPrincipal ? 'Excluded from Base' : 'Included' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="print-empty" *ngIf="investments.length === 0">No active investments recorded.</div>
          </div>

          <!-- Recurring Expenses Table -->
          <div class="print-section">
            <h3>3. Expense & Outflow Schedule</h3>
            <table class="print-table" *ngIf="expenses.length > 0">
              <thead>
                <tr>
                  <th>Expense Item</th>
                  <th>Type</th>
                  <th>Interval</th>
                  <th>Amount</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let exp of expenses">
                  <td><strong>{{ exp.name }}</strong></td>
                  <td>{{ exp.expenseType }}</td>
                  <td>{{ exp.recurrenceInterval || 'N/A' }}</td>
                  <td>{{ exp.amount | currency:settings.currencyCode() }}</td>
                  <td>{{ exp.startDate | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="print-empty" *ngIf="expenses.length === 0">No logged expenses recorded.</div>
          </div>

          <!-- Income & Credits Table -->
          <div class="print-section">
            <h3>4. Income & Credit Inflows</h3>
            <table class="print-table" *ngIf="credits.length > 0">
              <thead>
                <tr>
                  <th>Income Source</th>
                  <th>Interval</th>
                  <th>Amount</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of credits">
                  <td><strong>{{ c.sourceName }}</strong></td>
                  <td>{{ c.recurrenceInterval }}</td>
                  <td>+{{ c.amount | currency:settings.currencyCode() }}</td>
                  <td>{{ c.startDate | date:'mediumDate' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="print-empty" *ngIf="credits.length === 0">No active credits recorded.</div>
          </div>

          <!-- Financial Goals Table -->
          <div class="print-section">
            <h3>5. Financial Milestone Goals</h3>
            <table class="print-table" *ngIf="goals.length > 0">
              <thead>
                <tr>
                  <th>Goal Name</th>
                  <th>Target Amount</th>
                  <th>Target Date</th>
                  <th>Projected Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let g of goals">
                  <td><strong>{{ g.goalName }}</strong></td>
                  <td>{{ g.targetAmount | currency:settings.currencyCode() }}</td>
                  <td>{{ g.targetDate | date:'MMM yyyy' }}</td>
                  <td>{{ g.currentProjectedAmount | currency:settings.currencyCode() }}</td>
                  <td>{{ g.isOnTrack ? '✓ On Track' : '⚠️ Action Needed' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="print-empty" *ngIf="goals.length === 0">No milestone goals set.</div>
          </div>

          <div class="print-footer">
            <p>Report generated automatically by FLFP Engine • Confidential Financial Statement</p>
          </div>
        </div>
      
      <!-- Empty State -->
      <div *ngIf="accountState.portfolios().length === 0" class="empty-state-container">
        <div class="empty-state-card">
          <h2>Welcome to FLFP</h2>
          <p>You don't have any financial portfolios set up yet.</p>
          <p>Create a portfolio using our Guided Setup Wizard to establish your baseline balance and project your wealth!</p>
          <button class="btn-primary huge-btn" (click)="showWizard = true">🚀 Launch Guided Setup Wizard</button>
        </div>
      </div>
      
      <div *ngIf="!summary && accountState.activeAccountId()" class="loading-state">
        <p>Loading portfolio data...</p>
      </div>
    </div>
    
    <app-portfolio-modal *ngIf="showModal" (closed)="showModal = false"></app-portfolio-modal>
    <app-portfolio-wizard *ngIf="showWizard" (close)="showWizard = false"></app-portfolio-wizard>
  `,
  styles: [`
    .print-only-report { display: none; }
    
    @media print {
      .print-only-report {
        display: block !important;
        padding: 20px;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
      .print-brand h2 { font-size: 1.6rem; color: #0284c7 !important; margin: 0 0 4px 0; }
      .print-sub { font-size: 0.85rem; color: #64748b !important; margin: 0; }
      .print-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-bottom: 24px; }
      .print-meta div { font-size: 0.75rem; color: #64748b !important; }
      .print-meta div strong { display: block; font-weight: 600; margin-bottom: 4px; color: #0f172a !important; font-size: 0.95rem; }
      .print-section { margin-bottom: 24px; break-inside: avoid; }
      .print-section h3 { font-size: 1.1rem; color: #0f172a !important; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; }
      .print-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.85rem; }
      .print-table th, .print-table td { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; }
      .print-table th { background-color: #f1f5f9 !important; font-weight: 700; color: #334155 !important; }
      .print-footer { margin-top: 32px; text-align: center; font-size: 0.75rem; color: #94a3b8 !important; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    }

    .dashboard-container { display: flex; flex-direction: column; gap: 16px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
    .dashboard-header h1 { margin: 0; font-size: 1.5rem; color: var(--primary-color); }
    .subtitle { color: var(--text-muted); margin-top: 2px; font-size: 0.82rem; }

    .header-actions { display: flex; gap: 8px; align-items: center; }

    .export-report-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .excel-btn {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .excel-btn:hover { background: rgba(16, 185, 129, 0.25); }

    .edit-goal-box { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
    .mini-input { padding: 4px 8px; font-size: 0.78rem; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-color); border-radius: var(--radius-sm); }
    .edit-actions { display: flex; gap: 6px; margin-top: 4px; }
    .mini-btn { padding: 4px 10px; font-size: 0.75rem; border-radius: 4px; }
    
    .time-to-reach-tag { font-size: 0.72rem; color: var(--primary-color); font-weight: 600; background: var(--primary-glow); padding: 2px 8px; border-radius: 10px; display: inline-block; margin-top: 4px; }

    .card-btn-row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; }
    .edit-goal-btn { background: transparent; border: none; color: var(--primary-color); font-size: 0.7rem; font-weight: 600; cursor: pointer; box-shadow: none; padding: 0; }
    .delete-goal-btn { background: transparent; border: none; color: var(--negative-color); font-size: 0.7rem; cursor: pointer; box-shadow: none; padding: 0; }
    
    .charts-double-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 14px;
    }

    @media (max-width: 900px) {
      .charts-double-grid { grid-template-columns: 1fr; }
    }

    .empty-state-container { display: flex; justify-content: center; align-items: center; padding: 40px 16px; }
    .empty-state-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 30px; text-align: center; max-width: 460px; }
    .empty-state-card h2 { margin-top: 0; color: var(--primary-color); margin-bottom: 12px; font-size: 1.3rem; }
    .empty-state-card p { color: var(--text-muted); line-height: 1.5; margin-bottom: 16px; font-size: 0.9rem; }
    .huge-btn { font-size: 1rem; padding: 10px 24px; border-radius: 24px; }
    
    .content-grid { display: flex; flex-direction: column; gap: 16px; }

    /* FIRE Intelligence Card */
    .fire-intelligence-card {
      background: linear-gradient(135deg, rgba(92, 107, 192, 0.12) 0%, rgba(34, 197, 94, 0.08) 100%);
      border: 1px solid var(--primary-color);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-sm);
    }

    .fire-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .fire-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: var(--primary-color);
      color: #fff;
      padding: 2px 8px;
      border-radius: 10px;
      display: inline-block;
      margin-bottom: 4px;
    }

    .fire-title-group h2 { margin: 0; font-size: 1.15rem; color: var(--text-color); }

    .savings-rate-pill {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      padding: 5px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      display: flex;
      gap: 6px;
    }

    .fire-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 10px;
    }

    .fire-metric {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
    .metric-value { font-size: 1.25rem; font-weight: 800; font-family: 'Outfit', sans-serif; }
    .metric-sub { font-size: 0.7rem; color: var(--text-muted); }
    .accent-text { color: var(--primary-color); }
    .positive-text { color: var(--positive-color); }
    .negative-text { color: var(--negative-color); }

    .fire-progress-bar-container {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .progress-labels { display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; }
    .progress-track { background: var(--surface-hover); height: 7px; border-radius: 4px; overflow: hidden; }
    .progress-fill { background: linear-gradient(90deg, var(--primary-color) 0%, #4ade80 100%); height: 100%; transition: width 0.4s ease; }
    
    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }
    
    .bento-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      min-height: 110px;
    }
    
    .bento-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .baseline-card { border-top: 3px solid var(--primary-color); }
    .projection-card { border-top: 3px solid var(--positive-color); }
    .simulator-bento-card { border-top: 3px solid var(--warning-color); background: linear-gradient(180deg, var(--surface-color) 0%, var(--surface-hover) 100%); }

    .bento-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .bento-icon {
      color: var(--primary-color);
      background: var(--primary-glow);
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bento-title {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .bento-amount {
      font-size: 1.4rem;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }

    .bento-amount.highlight {
      color: var(--primary-color);
    }

    .bento-subtext {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .simulator-controls {
      margin-bottom: 6px;
    }

    .date-picker {
      width: 100%;
      padding: 5px 8px;
      font-size: 0.78rem;
    }

    .simulator-result {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .variance-tag {
      font-size: 0.78rem;
      font-weight: 600;
    }

    .positive { color: var(--positive-color); }
    .negative { color: var(--negative-color); }

    /* Chart Section & Inflation Toggle */
    .chart-section { padding: 16px; border-radius: var(--radius-lg); }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
    .chart-header h3 { font-size: 1.1rem; margin: 0; }
    .chart-title-group { display: flex; align-items: center; gap: 12px; }
    .inflation-toggle-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      background: var(--surface-hover);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .inflation-toggle-btn.active {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.4);
    }

    /* Goals Section */
    .goals-section { display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: var(--radius-lg); }
    .goals-header { display: flex; justify-content: space-between; align-items: center; }
    .goals-header h3 { font-size: 1.1rem; margin: 0; }
    .goals-title-group { display: flex; align-items: center; gap: 10px; }
    .goals-icon { background: var(--primary-glow); color: var(--primary-color); padding: 6px; border-radius: var(--radius-md); }

    .goal-form-container { background: var(--surface-hover); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .goal-form { display: flex; flex-direction: column; gap: 10px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
    .form-group { display: flex; flex-direction: column; gap: 3px; }
    .form-group label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }

    .goals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .no-goals-text { color: var(--text-muted); font-size: 0.8rem; font-style: italic; }
    .goal-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
    }

    .goal-card.on-track { border-left: 3px solid var(--positive-color); }
    .goal-card.off-track { border-left: 3px solid var(--warning-color); }

    .goal-card-header { display: flex; justify-content: space-between; align-items: center; }
    .goal-name { font-weight: 700; font-size: 0.9rem; color: var(--text-color); }
    .track-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 8px; }
    .on-track-badge { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .off-track-badge { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    .goal-amount-row { display: flex; justify-content: space-between; align-items: baseline; }
    .target-val { font-size: 1.1rem; font-weight: 800; color: var(--text-color); }
    .goal-date { font-size: 0.75rem; color: var(--text-muted); }
    .goal-projected-sub { font-size: 0.75rem; color: var(--text-muted); }
    .delete-goal-btn { align-self: flex-end; background: transparent; border: none; color: var(--negative-color); font-size: 0.7rem; cursor: pointer; }

    /* Portfolio Assets & Cashflows Bento Grid */
    .assets-bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }

    .bento-detail-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-sm);
    }

    .credits-bento-card { border-top: 3px solid var(--positive-color); }
    .expenses-bento-card { border-top: 3px solid var(--negative-color); }
    .investments-bento-card { border-top: 3px solid var(--primary-color); }

    .bento-detail-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
    }

    .bento-detail-icon {
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .positive-icon { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .negative-icon { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .accent-icon { background: var(--primary-glow); color: var(--primary-color); }

    .bento-detail-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-color);
    }

    .count-pill {
      margin-left: auto;
      background: var(--surface-hover);
      color: var(--text-muted);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }

    .bento-detail-body { display: flex; flex-direction: column; gap: 6px; }
    .bento-empty-text { color: var(--text-muted); font-size: 0.8rem; font-style: italic; }

    .bento-item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .bento-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .flex-column-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .item-header-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      align-items: center;
    }

    .item-main { display: flex; flex-direction: column; }
    .item-name { font-weight: 600; font-size: 0.82rem; color: var(--text-color); }
    .item-sub { font-size: 0.7rem; color: var(--text-muted); }

    .item-amount { font-weight: 700; font-size: 0.82rem; }
    .positive-val { color: var(--positive-color); }
    .negative-val { color: var(--negative-color); }
    .accent-val { color: var(--primary-color); }

    .item-tags-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .mini-tag { font-size: 0.65rem; font-weight: 600; padding: 1px 5px; border-radius: 4px; }
    .style-tag { background: rgba(92, 107, 192, 0.2); color: #8c9eff; }
    .rate-tag { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .excluded-tag { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    
    .time-filters { display: flex; gap: 4px; }
    .time-filters button { padding: 4px 10px; font-size: 0.78rem; background-color: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-sm); }
    .time-filters button.active { background-color: var(--primary-glow); color: var(--primary-color); border-color: var(--primary-color); font-weight: 600; }
    .time-filters button:hover { background-color: var(--surface-hover); }
  `]
})
export class DashboardPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  projectionService = inject(ProjectionService);
  settings = inject(SettingsService);
  exportService = inject(ExportService);
  
  summary: DashboardSummaryResponse | null = null;
  fireSummary: FireSummaryResponse | null = null;
  customProjection: ProjectionResponse | null = null;
  targetDate: string = '';
  projectionMonths: number = 12; // Default to 1 Year
  showModal = false;
  showWizard = false;

  credits: any[] = [];
  expenses: any[] = [];
  investments: any[] = [];

  // Goal Planner & Edit
  goals: GoalResponse[] = [];
  showGoalForm = false;
  editingGoalId: number | null = null;
  editGoalData: GoalUpdateRequest = {
    goalName: '',
    targetAmount: 0,
    targetDate: ''
  };
  newGoal: GoalCreateRequest = {
    accountId: 0,
    goalName: '',
    targetAmount: 0,
    targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0]
  };

  // Inflation Toggle
  adjustForInflation = false;
  
  // Chart Data
  chartLabels: string[] = [];
  chartData: number[] = [];
  displayChartData: number[] = [];

  constructor() {
    effect(() => {
      const activeId = this.accountState.activeAccountId();
      if (activeId) {
        this.newGoal.accountId = activeId;
        this.loadDashboard(activeId);
      } else {
        this.summary = null;
        this.fireSummary = null;
        this.customProjection = null;
        this.credits = [];
        this.expenses = [];
        this.investments = [];
        this.goals = [];
      }
    });
  }

  ngOnInit() {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    this.targetDate = d.toISOString().split('T')[0];
  }

  exportReport() {
    window.print();
  }

  exportExcelData() {
    if (!this.summary) return;
    
    // Export Investments sheet
    if (this.investments && this.investments.length > 0) {
      this.exportService.exportToCsv('FLFP_Investments', this.investments, [
        { key: 'investmentName', label: 'Investment Name' },
        { key: 'investmentStyle', label: 'Style / Type' },
        { key: 'investedAmount', label: 'Invested Amount ($)' },
        { key: 'rateOfInterest', label: 'Annual Interest Rate (%)' },
        { key: 'startDate', label: 'Start Date' },
        { key: 'maturityDate', label: 'Maturity Date' }
      ]);
    } else {
      // Export Dashboard Summary sheet
      this.exportService.exportToCsv('FLFP_Financial_Summary', [
        {
          Metric: 'Current Cash Balance',
          Value: this.summary.currentBalance
        },
        {
          Metric: '+30 Days Projected Balance',
          Value: this.summary.projectedBalance30Days
        },
        {
          Metric: '+1 Year Projected Balance',
          Value: this.summary.projectedBalance1Year
        },
        {
          Metric: 'FIRE Target Nest Egg',
          Value: this.fireSummary?.fireTargetNumber || 0
        },
        {
          Metric: 'Savings Rate (%)',
          Value: this.fireSummary?.savingsRatePercent || 0
        }
      ]);
    }
  }

  getTimeToReachText(targetDateStr: string): string {
    if (!targetDateStr) return 'Target Date Unset';
    const target = new Date(targetDateStr);
    const today = new Date();
    
    const diffMs = target.getTime() - today.getTime();
    if (diffMs <= 0) return 'Goal Date Reached!';

    const totalMonths = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24 * 30.44)));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years === 0) return `Target in ${months} mos`;
    if (months === 0) return `Target in ${years} yrs`;
    return `Target in ${years} yrs ${months} mos`;
  }

  startEditGoal(goal: GoalResponse) {
    this.editingGoalId = goal.id;
    this.editGoalData = {
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate
    };
  }

  saveGoalEdit(goalId: number) {
    if (!this.editGoalData.goalName || !this.editGoalData.targetAmount) return;

    this.api.put<GoalResponse>(`/api/v1/goals/${goalId}`, this.editGoalData).subscribe({
      next: (updated) => {
        const idx = this.goals.findIndex(g => g.id === goalId);
        if (idx !== -1) {
          this.goals[idx] = updated;
        }
        this.editingGoalId = null;
      },
      error: (err) => {
        console.error('Failed to update goal', err);
        // Fallback update local array if endpoint not ready
        const idx = this.goals.findIndex(g => g.id === goalId);
        if (idx !== -1) {
          this.goals[idx] = { ...this.goals[idx], ...this.editGoalData };
        }
        this.editingGoalId = null;
      }
    });
  }

  loadDashboard(accountId: number) {
    this.projectionService.getDashboardSummary(accountId).subscribe({
      next: (res) => {
        this.summary = res;
        this.loadChartData(accountId);
        this.runSimulation();
      },
      error: (err) => console.error('Failed to load dashboard summary', err)
    });

    this.api.get<FireSummaryResponse>(`/api/v1/projections/fire-summary?accountId=${accountId}`).subscribe({
      next: (res) => this.fireSummary = res,
      error: (err) => console.error('Failed to load FIRE summary', err)
    });

    this.api.get<GoalResponse[]>(`/api/v1/goals/account/${accountId}`).subscribe({
      next: (res) => this.goals = res,
      error: (err) => console.error('Failed to load goals', err)
    });

    this.api.get<any[]>(`/api/v1/credits/account/${accountId}`).subscribe({
      next: (res) => this.credits = res,
      error: (err) => console.error('Failed to load credits', err)
    });

    this.api.get<any[]>(`/api/v1/expenses/account/${accountId}`).subscribe({
      next: (res) => this.expenses = res,
      error: (err) => console.error('Failed to load expenses', err)
    });

    this.api.get<any[]>(`/api/v1/investments/account/${accountId}`).subscribe({
      next: (res) => this.investments = [...(res || [])],
      error: (err) => console.error('Failed to load investments', err)
    });
  }

  loadChartData(accountId: number) {
    const requests: any[] = [];
    const labels: string[] = [];

    let currentDate = new Date();

    let step = 1;
    if (this.projectionMonths > 12) step = 3;
    if (this.projectionMonths > 36) step = 6;

    for (let i = step; i <= this.projectionMonths; i += step) {
      let futureDate = new Date(currentDate);
      futureDate.setMonth(currentDate.getMonth() + i);
      const dateString = futureDate.toISOString().split('T')[0];

      labels.push(futureDate.toLocaleString('default', { month: 'short' }) + " '" + futureDate.getFullYear().toString().substr(-2));
      requests.push(this.projectionService.calculateProjection(accountId, dateString));
    }

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.chartLabels = labels;
        this.chartData = responses.map(r => r.projectedBalance);
        this.updateDisplayChartData();
      },
      error: (err) => console.error('Failed to load chart data', err)
    });
  }

  toggleInflation() {
    this.adjustForInflation = !this.adjustForInflation;
    this.updateDisplayChartData();
  }

  updateDisplayChartData() {
    if (!this.adjustForInflation) {
      this.displayChartData = [...this.chartData];
    } else {
      // 5% Annual inflation discount factor: (1 + 0.05)^(-years)
      const step = this.projectionMonths > 36 ? 0.5 : (this.projectionMonths > 12 ? 0.25 : 0.0833);
      this.displayChartData = this.chartData.map((val, index) => {
        const years = (index + 1) * step;
        const discountFactor = Math.pow(1.05, -years);
        return Math.round(val * discountFactor);
      });
    }
  }

  setProjectionTime(months: number) {
    this.projectionMonths = months;
    const activeId = this.accountState.activeAccountId();
    if (activeId) {
      this.loadChartData(activeId);
    }
  }

  runSimulation() {
    const activeId = this.accountState.activeAccountId();
    if (!activeId || !this.targetDate) return;

    this.projectionService.calculateProjection(activeId, this.targetDate).subscribe({
      next: (res) => this.customProjection = res,
      error: (err) => console.error('Failed to run simulation', err)
    });
  }

  createGoal() {
    const activeId = this.accountState.activeAccountId();
    if (!activeId || !this.newGoal.goalName || !this.newGoal.targetAmount) return;

    this.newGoal.accountId = activeId;
    this.api.post<GoalResponse>('/api/v1/goals', this.newGoal).subscribe({
      next: (res) => {
        this.goals.push(res);
        this.showGoalForm = false;
        this.newGoal.goalName = '';
        this.newGoal.targetAmount = 0;
      },
      error: (err) => console.error('Failed to create goal', err)
    });
  }

  deleteGoal(id: number) {
    this.api.delete(`/api/v1/goals/${id}`).subscribe({
      next: () => this.goals = this.goals.filter(g => g.id !== id),
      error: (err) => console.error('Failed to delete goal', err)
    });
  }

  get activePortfolioName(): string {
    const activeId = this.accountState.activeAccountId();
    const portfolio = this.accountState.portfolios().find(p => p.id === activeId);
    return portfolio ? portfolio.accountName : 'Primary Portfolio';
  }

  get activePortfolioBank(): string {
    const activeId = this.accountState.activeAccountId();
    const portfolio = this.accountState.portfolios().find(p => p.id === activeId);
    return portfolio ? portfolio.bankName : 'N/A';
  }

  get todayDate(): string {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
