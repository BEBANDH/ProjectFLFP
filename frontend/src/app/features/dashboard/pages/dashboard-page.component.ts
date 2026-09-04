import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountStateService } from '../../../core/services/account-state.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ExportService } from '../../../core/services/export.service';
import { ProjectionService } from '../services/projection.service';
import { DashboardCacheService } from '../../../core/services/dashboard-cache.service';
import { ProjectionResponse, DashboardSummaryResponse, FireSummaryResponse, GoalResponse, GoalCreateRequest, GoalUpdateRequest } from '../../../shared/models/common-api.models';
import { ProjectionChartComponent } from '../components/projection-chart/projection-chart.component';
import { AssetAllocationChartComponent } from '../components/asset-allocation-chart/asset-allocation-chart.component';
import { FireGaugeComponent } from '../components/fire-gauge/fire-gauge.component';
import { PortfolioModalComponent } from '../../../shared/components/portfolio-modal/portfolio-modal.component';
import { PortfolioWizardComponent } from '../../../shared/components/portfolio-wizard/portfolio-wizard.component';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ProjectionChartComponent,
    AssetAllocationChartComponent,
    FireGaugeComponent,
    PortfolioModalComponent,
    PortfolioWizardComponent
  ],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div>
          <h1>Financial Dashboard & Projection Engine</h1>
          <p class="subtitle">Compounding trajectories, FIRE milestones & cashflow intelligence</p>
        </div>
        <div class="header-actions">
          <div class="account-selector-wrapper" *ngIf="accountState.portfolios().length > 0">
            <span class="selector-label">Account:</span>
            <select 
              class="account-dropdown" 
              [ngModel]="accountState.activeAccountId()" 
              (ngModelChange)="accountState.setActiveAccount($event)">
              <option *ngFor="let p of accountState.portfolios()" [ngValue]="p.id">
                {{ p.accountName }} ({{ p.bankName }})
              </option>
            </select>
          </div>
        </div>
      </header>

      <div class="content-grid" *ngIf="summary && accountState.activeAccountId()">
        
        <!-- Top Compact Bento Grid KPI Strip -->
        <div class="bento-grid">
          <!-- Card 1: Baseline -->
          <div class="bento-card baseline-card">
            <div class="bento-card-header">
              <div class="bento-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <span class="bento-title">Current Baseline</span>
            </div>
            <div class="bento-amount">{{ summary.currentBalance | currency:settings.currencyCode() }}</div>
            <div class="bento-subtext">Active portfolio cash</div>
          </div>

          <!-- Card 2: +30 Days -->
          <div class="bento-card projection-card">
            <div class="bento-card-header">
              <div class="bento-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span class="bento-title">+30 Days Projection</span>
            </div>
            <div class="bento-amount">{{ summary.projectedBalance30Days | currency:settings.currencyCode() }}</div>
            <div class="bento-subtext">30-day liquidity forecast</div>
          </div>

          <!-- Card 3: +365 Days -->
          <div class="bento-card projection-card">
            <div class="bento-card-header">
              <div class="bento-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <span class="bento-title">+1 Year Projection</span>
            </div>
            <div class="bento-amount">{{ summary.projectedBalance1Year | currency:settings.currencyCode() }}</div>
            <div class="bento-subtext">Compounded annual growth</div>
          </div>

          <!-- Card 4: Simulator -->
          <div class="bento-card simulator-bento-card">
            <div class="bento-card-header">
              <div class="bento-icon accent-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
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

        <!-- Middle Row: Analytics Double Grid (Wealth Trajectory & Assets on Left, FIRE Gauge on Right) -->
        <div class="charts-double-grid">
          <!-- Left Column: Wealth Trajectory & Inline Assets/Expenses/Credits -->
          <div class="main-trajectory-col">
            <!-- Wealth Trajectory Section -->
            <div class="chart-section card">
              <div class="chart-header">
                <div class="chart-title-group">
                  <h3>Wealth Trajectory</h3>
                  <button 
                    class="inflation-toggle-btn" 
                    [class.active]="adjustForInflation" 
                    (click)="toggleInflation()">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                    {{ adjustForInflation ? 'Inflation Adjusted (5%)' : 'Nominal Wealth' }}
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
                [data]="displayChartData">
              </app-projection-chart>
            </div>

            <!-- Portfolio Assets & Cashflows Bento Grid (Right Below Chart) -->
            <div class="assets-bento-grid">
              <!-- Bento Card 1: Credits & Income -->
              <div class="bento-detail-card credits-bento-card">
                <a routerLink="/credits" class="bento-detail-header clickable-header" title="Open Credits & Income Management">
                  <div class="bento-detail-icon positive-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <span class="bento-detail-title">Income & Credits</span>
                  <span class="count-pill">{{ credits.length }}</span>
                  <svg class="nav-arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </a>
                <div class="bento-detail-body">
                  <div *ngIf="credits.length === 0" class="bento-empty-text">No active credits</div>
                  <ul class="bento-item-list" *ngIf="credits.length > 0">
                    <li *ngFor="let item of credits | slice:0:3" class="bento-item">
                      <div class="item-main">
                        <span class="item-name">{{ item.sourceName }}</span>
                        <span class="item-sub">
                          {{ item.recurrenceInterval }}
                          <span *ngIf="item.growthPercentage && item.growthPercentage > 0" style="color: var(--positive-color); margin-left: 4px; font-weight: 600;">
                            • +{{ item.growthPercentage }}%/yr
                          </span>
                        </span>
                      </div>
                      <span class="item-amount positive-val">+{{ item.amount | currency:settings.currencyCode() }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Bento Card 2: Expenses & Outflows -->
              <div class="bento-detail-card expenses-bento-card">
                <a routerLink="/expenses" class="bento-detail-header clickable-header" title="Open Expenses Management">
                  <div class="bento-detail-icon negative-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <span class="bento-detail-title">Expenses</span>
                  <span class="count-pill">{{ expenses.length }}</span>
                  <svg class="nav-arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </a>
                <div class="bento-detail-body">
                  <div *ngIf="expenses.length === 0" class="bento-empty-text">No logged expenses</div>
                  <ul class="bento-item-list" *ngIf="expenses.length > 0">
                    <li *ngFor="let item of expenses | slice:0:3" class="bento-item">
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
                <a routerLink="/investments" class="bento-detail-header clickable-header" title="Open Investments Management">
                  <div class="bento-detail-icon accent-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  </div>
                  <span class="bento-detail-title">Investments</span>
                  <span class="count-pill">{{ investments.length }}</span>
                  <svg class="nav-arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </a>
                <div class="bento-detail-body">
                  <div *ngIf="investments.length === 0" class="bento-empty-text">No active investments</div>
                  <ul class="bento-item-list" *ngIf="investments.length > 0">
                    <li *ngFor="let item of investments | slice:0:3" class="bento-item flex-column-item">
                      <div class="item-header-row">
                        <span class="item-name">{{ item.investmentName }}</span>
                        <span class="item-amount accent-val">{{ item.investedAmount | currency:settings.currencyCode() }}</span>
                      </div>
                      <div class="item-tags-row">
                        <span class="mini-tag style-tag">{{ item.investmentStyle }}</span>
                        <span class="mini-tag rate-tag">&#64; {{ item.rateOfInterest }}%</span>
                        <span class="mini-tag excluded-tag" *ngIf="item.isExcludedFromPrincipal">Excluded</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Visual FIRE Freedom Gauge & Asset Allocation Donut -->
          <div class="side-visuals-col">
            <app-fire-gauge [fireSummary]="fireSummary"></app-fire-gauge>
            <app-asset-allocation-chart [investments]="investments"></app-asset-allocation-chart>
          </div>
        </div>

        <!-- Full-Width Bottom Section: Milestone Goals Planner -->
        <div class="goals-section card">
          <div class="goals-header">
            <div class="goals-title-group">
              <div class="goals-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              </div>
              <div>
                <h3>Milestone Goals Planner</h3>
                <p class="subtitle">Set targets and verify if your portfolio is on pace</p>
              </div>
            </div>
            <button class="btn-primary mini-action-btn" (click)="showGoalForm = !showGoalForm">
              {{ showGoalForm ? 'Cancel' : '+ Add Goal' }}
            </button>
          </div>

          <!-- Add Goal Form -->
          <div class="goal-form-container" *ngIf="showGoalForm">
            <form (ngSubmit)="createGoal()" class="goal-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Goal Name</label>
                  <input type="text" [(ngModel)]="newGoal.goalName" name="goalName" placeholder="e.g. House Down Payment" required>
                </div>
                <div class="form-group">
                  <label>Target ({{ settings.currencyCode() }})</label>
                  <input type="number" [(ngModel)]="newGoal.targetAmount" name="targetAmount" placeholder="50000" required>
                </div>
                <div class="form-group">
                  <label>Target Date</label>
                  <input type="date" [(ngModel)]="newGoal.targetDate" name="targetDate" required>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary">Save Goal</button>
              </div>
            </form>
          </div>

          <!-- Goals Cards Grid -->
          <div class="goals-grid">
            <div *ngIf="goals.length === 0" class="no-goals-text">
              No financial goals configured. Add a milestone goal to verify progress against compounding returns!
            </div>
            <div *ngFor="let goal of goals" class="goal-card" [class.on-track]="goal.isOnTrack" [class.off-track]="!goal.isOnTrack">
              <div class="goal-card-header">
                <span class="goal-name">{{ goal.goalName }}</span>
                <span class="track-badge" [ngClass]="goal.isOnTrack ? 'on-track-badge' : 'off-track-badge'">
                  {{ goal.isOnTrack ? '✓ On Track' : '⚠️ Behind Pace' }}
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

      </div> <!-- End content-grid -->

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
    .dashboard-container { display: flex; flex-direction: column; gap: 14px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
    .dashboard-header h1 { margin: 0; font-size: 1.3rem; color: var(--text-color); font-weight: 700; }
    .subtitle { color: var(--text-muted); margin-top: 2px; font-size: 0.78rem; }

    .header-actions { display: flex; gap: 10px; align-items: center; }

    .account-selector-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      padding: 4px 10px;
      border-radius: var(--radius-md);
    }

    .selector-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .account-dropdown {
      background: transparent;
      border: none;
      color: var(--text-color);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 4px;
      outline: none;
    }

    .account-dropdown option {
      background: var(--surface-color);
      color: var(--text-color);
    }

    .edit-goal-box { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    .mini-input { padding: 4px 8px; font-size: 0.75rem; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-color); border-radius: var(--radius-sm); }
    .edit-actions { display: flex; gap: 6px; margin-top: 4px; }
    .mini-btn { padding: 3px 8px; font-size: 0.72rem; border-radius: 4px; box-shadow: none; }
    .mini-action-btn { padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-md); box-shadow: none; }
    
    .time-to-reach-tag { font-size: 0.68rem; color: var(--primary-color); font-weight: 600; background: var(--primary-glow); padding: 1px 6px; border-radius: 8px; display: inline-block; margin-top: 2px; }

    .card-btn-row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
    .edit-goal-btn { background: transparent; border: none; color: var(--primary-color); font-size: 0.68rem; font-weight: 600; cursor: pointer; box-shadow: none; padding: 0; }
    .delete-goal-btn { background: transparent; border: none; color: var(--negative-color); font-size: 0.68rem; cursor: pointer; box-shadow: none; padding: 0; }
    
    .charts-double-grid {
      display: grid;
      grid-template-columns: 1.45fr 1fr;
      gap: 12px;
      align-items: stretch;
    }

    .main-trajectory-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .side-visuals-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    @media (max-width: 950px) {
      .charts-double-grid { grid-template-columns: 1fr; }
    }

    .empty-state-container { display: flex; justify-content: center; align-items: center; padding: 30px 16px; }
    .empty-state-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; text-align: center; max-width: 420px; }
    .empty-state-card h2 { margin-top: 0; color: var(--primary-color); margin-bottom: 8px; font-size: 1.15rem; }
    .empty-state-card p { color: var(--text-muted); line-height: 1.4; margin-bottom: 12px; font-size: 0.82rem; }
    .huge-btn { font-size: 0.9rem; padding: 8px 18px; border-radius: 20px; }
    
    .content-grid { display: flex; flex-direction: column; gap: 12px; }

    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px;
    }
    
    .bento-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
      min-height: 95px;
    }
    
    .baseline-card { border-top: 2px solid var(--primary-color); }
    .projection-card { border-top: 2px solid var(--positive-color); }
    .simulator-bento-card { border-top: 2px solid var(--warning-color); }

    .bento-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .bento-icon {
      color: var(--primary-color);
      background: var(--primary-glow);
      padding: 3px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bento-title {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .bento-amount {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }

    .bento-amount.highlight {
      color: #818cf8;
    }

    .bento-subtext {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .simulator-controls {
      margin-bottom: 4px;
    }

    .date-picker {
      width: 100%;
      padding: 3px 6px;
      font-size: 0.75rem;
    }

    .simulator-result {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .variance-tag {
      font-size: 0.72rem;
      font-weight: 600;
    }

    .positive { color: var(--positive-color); }
    .negative { color: var(--negative-color); }

    /* Chart Section & Inflation Toggle */
    .chart-section { padding: 14px 16px; border-radius: var(--radius-lg); }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
    .chart-header h3 { font-size: 0.95rem; margin: 0; color: var(--text-color); }
    .chart-title-group { display: flex; align-items: center; gap: 10px; }
    .inflation-toggle-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--surface-hover);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: none;
    }

    .inflation-toggle-btn.active {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.3);
    }

    /* Goals Section */
    .goals-section { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border-radius: var(--radius-lg); }
    .goals-header { display: flex; justify-content: space-between; align-items: center; }
    .goals-header h3 { font-size: 0.95rem; margin: 0; color: var(--text-color); }
    .goals-title-group { display: flex; align-items: center; gap: 8px; }
    .goals-icon { background: var(--primary-glow); color: var(--primary-color); padding: 5px; border-radius: var(--radius-md); }

    .goal-form-container { background: var(--surface-hover); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .goal-form { display: flex; flex-direction: column; gap: 8px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; }
    .form-group { display: flex; flex-direction: column; gap: 2px; }
    .form-group label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted); }

    .goals-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .no-goals-text { color: var(--text-muted); font-size: 0.78rem; font-style: italic; }
    .goal-card {
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .goal-card.on-track { border-left: 2px solid var(--positive-color); }
    .goal-card.off-track { border-left: 2px solid var(--warning-color); }

    .goal-card-header { display: flex; justify-content: space-between; align-items: center; }
    .goal-name { font-weight: 700; font-size: 0.82rem; color: var(--text-color); }
    .track-badge { font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
    .on-track-badge { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .off-track-badge { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    .goal-amount-row { display: flex; justify-content: space-between; align-items: baseline; }
    .target-val { font-size: 0.95rem; font-weight: 800; color: var(--text-color); }
    .goal-date { font-size: 0.7rem; color: var(--text-muted); }
    .goal-projected-sub { font-size: 0.7rem; color: var(--text-muted); }
    .delete-goal-btn { align-self: flex-end; background: transparent; border: none; color: var(--negative-color); font-size: 0.68rem; cursor: pointer; }

    /* Portfolio Assets & Cashflows Bento Grid */
    .assets-bento-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    @media (max-width: 800px) {
      .assets-bento-grid { grid-template-columns: 1fr; }
    }

    .bento-detail-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: var(--shadow-sm);
    }

    .credits-bento-card { border-top: 2px solid var(--positive-color); }
    .expenses-bento-card { border-top: 2px solid var(--negative-color); }
    .investments-bento-card { border-top: 2px solid var(--primary-color); }

    .bento-detail-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border-color);
      text-decoration: none;
      color: inherit;
      transition: opacity 0.15s ease;
    }

    .clickable-header {
      cursor: pointer;
    }

    .clickable-header:hover {
      opacity: 0.85;
    }

    .clickable-header:hover .bento-detail-title {
      color: var(--primary-color);
    }

    .nav-arrow-icon {
      margin-left: 2px;
      color: var(--text-muted);
      transition: transform 0.15s ease;
    }

    .clickable-header:hover .nav-arrow-icon {
      transform: translateX(2px);
      color: var(--primary-color);
    }

    .bento-detail-icon {
      padding: 3px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .positive-icon { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .negative-icon { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .accent-icon { background: var(--primary-glow); color: var(--primary-color); }

    .bento-detail-title {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-color);
      transition: color 0.15s ease;
    }

    .count-pill {
      margin-left: auto;
      background: var(--surface-hover);
      color: var(--text-muted);
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .bento-detail-body { display: flex; flex-direction: column; gap: 5px; }
    .bento-empty-text { color: var(--text-muted); font-size: 0.72rem; font-style: italic; }

    .bento-item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
    .bento-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 6px;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .flex-column-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .item-header-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      align-items: center;
    }

    .item-main { display: flex; flex-direction: column; }
    .item-name { font-weight: 600; font-size: 0.74rem; color: var(--text-color); }
    .item-sub { font-size: 0.65rem; color: var(--text-muted); }

    .item-amount { font-weight: 700; font-size: 0.74rem; }
    .positive-val { color: var(--positive-color); }
    .negative-val { color: var(--negative-color); }
    .accent-val { color: #818cf8; }

    .item-tags-row { display: flex; gap: 3px; flex-wrap: wrap; }
    .mini-tag { font-size: 0.6rem; font-weight: 600; padding: 1px 3px; border-radius: 3px; }
    .style-tag { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .rate-tag { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .excluded-tag { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    
    .time-filters { display: flex; gap: 3px; }
    .time-filters button { padding: 3px 8px; font-size: 0.72rem; background-color: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-sm); box-shadow: none; }
    .time-filters button:hover { background-color: var(--surface-hover); }
  `]
})
export class DashboardPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  projectionService = inject(ProjectionService);
  dashboardCache = inject(DashboardCacheService);
  settings = inject(SettingsService);
  exportService = inject(ExportService);
  cdr = inject(ChangeDetectorRef);
  
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
    // Single forkJoin — all 6 requests in parallel, results from cache when fresh
    forkJoin({
      summary:     this.dashboardCache.getDashboardSummary(accountId),
      fireSummary: this.dashboardCache.getFireSummary(accountId),
      goals:       this.dashboardCache.getGoals(accountId),
      credits:     this.dashboardCache.getCredits(accountId),
      expenses:    this.dashboardCache.getExpenses(accountId),
      investments: this.dashboardCache.getInvestments(accountId)
    }).subscribe({
      next: ({ summary, fireSummary, goals, credits, expenses, investments }) => {
        this.summary     = summary;
        this.fireSummary = fireSummary;
        this.goals       = goals;
        this.credits     = credits;
        this.expenses    = expenses;
        this.investments = [...(investments || [])];
        this.cdr.markForCheck();
        this.loadChartData(accountId);
        this.runSimulation();
      },
      error: (err) => console.error('Failed to load dashboard data', err)
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
        this.dashboardCache.invalidateAccount(activeId); // refresh on next load
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to create goal', err)
    });
  }

  deleteGoal(id: number) {
    const activeId = this.accountState.activeAccountId();
    this.api.delete(`/api/v1/goals/${id}`).subscribe({
      next: () => {
        this.goals = this.goals.filter(g => g.id !== id);
        if (activeId) this.dashboardCache.invalidateAccount(activeId);
        this.cdr.markForCheck();
      },
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
