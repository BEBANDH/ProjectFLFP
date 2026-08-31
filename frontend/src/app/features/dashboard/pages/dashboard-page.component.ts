import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountStateService } from '../../../core/services/account-state.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ProjectionService } from '../services/projection.service';
import { ProjectionResponse, DashboardSummaryResponse } from '../../../shared/models/common-api.models';
import { ProjectionChartComponent } from '../components/projection-chart/projection-chart.component';
import { PortfolioModalComponent } from '../../../shared/components/portfolio-modal/portfolio-modal.component';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectionChartComponent, PortfolioModalComponent],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Financial Projection Engine</h1>
        <p class="subtitle">Real-time wealth simulation & compounding trajectory</p>
      </header>

      <div class="content-grid" *ngIf="summary && accountState.activeAccountId()">
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
        
        <!-- Interactive Chart -->
        <div class="chart-section card">
          <div class="chart-header">
            <h3>Wealth Trajectory</h3>
            <div class="time-filters">
              <button [class.active]="projectionMonths === 6" (click)="setProjectionTime(6)">6M</button>
              <button [class.active]="projectionMonths === 12" (click)="setProjectionTime(12)">1Y</button>
              <button [class.active]="projectionMonths === 36" (click)="setProjectionTime(36)">3Y</button>
              <button [class.active]="projectionMonths === 60" (click)="setProjectionTime(60)">5Y</button>
            </div>
          </div>
          <app-projection-chart 
            [labels]="chartLabels" 
            [data]="chartData">
          </app-projection-chart>
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
        </div>
      </div>
      
      <!-- Empty State -->
      <div *ngIf="accountState.portfolios().length === 0" class="empty-state-container">
        <div class="empty-state-card">
          <h2>Welcome to FLFP</h2>
          <p>You don't have any financial portfolios set up yet.</p>
          <p>Create a portfolio to establish your baseline balance and start projecting your wealth!</p>
          <button class="btn-primary huge-btn" (click)="showModal = true">+ Create a Portfolio</button>
        </div>
      </div>
      
      <div *ngIf="!summary && accountState.activeAccountId()" class="loading-state">
        <p>Loading portfolio data...</p>
      </div>
    </div>
    
    <app-portfolio-modal *ngIf="showModal" (closed)="showModal = false"></app-portfolio-modal>
  `,
  styles: [`
    .dashboard-container { display: flex; flex-direction: column; gap: 24px; }
    .dashboard-header h1 { margin: 0; color: var(--primary-color); }
    .subtitle { color: var(--text-muted); margin-top: 5px; }
    
    .empty-state-container { display: flex; justify-content: center; align-items: center; padding: 50px 20px; }
    .empty-state-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 40px; text-align: center; max-width: 500px; }
    .empty-state-card h2 { margin-top: 0; color: var(--primary-color); margin-bottom: 15px; }
    .empty-state-card p { color: var(--text-muted); line-height: 1.6; margin-bottom: 20px; }
    .huge-btn { font-size: 1.1rem; padding: 12px 30px; border-radius: 30px; }
    
    .content-grid { display: flex; flex-direction: column; gap: 24px; }
    
    /* Bento Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }
    
    .bento-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow-md);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      min-height: 140px;
    }
    
    .bento-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .baseline-card { border-top: 4px solid var(--primary-color); }
    .projection-card { border-top: 4px solid var(--positive-color); }
    .simulator-bento-card { border-top: 4px solid var(--warning-color); background: linear-gradient(180deg, var(--surface-color) 0%, var(--surface-hover) 100%); }

    .bento-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .bento-icon {
      color: var(--primary-color);
      background: var(--primary-glow);
      padding: 6px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bento-title {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .bento-amount {
      font-size: 1.75rem;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }

    .bento-amount.highlight {
      color: var(--primary-color);
    }

    .bento-subtext {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 6px;
    }

    .simulator-controls {
      margin-bottom: 10px;
    }

    .date-picker {
      width: 100%;
      padding: 8px 12px;
      font-size: 0.85rem;
    }

    .simulator-result {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .variance-tag {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .positive { color: var(--positive-color); }
    .negative { color: var(--negative-color); }

    /* Portfolio Assets & Cashflows Bento Grid */
    .assets-bento-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .bento-detail-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: var(--shadow-md);
    }

    .credits-bento-card { border-top: 4px solid var(--positive-color); }
    .expenses-bento-card { border-top: 4px solid var(--negative-color); }
    .investments-bento-card { border-top: 4px solid var(--primary-color); }

    .bento-detail-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }

    .bento-detail-icon {
      padding: 6px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .positive-icon { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .negative-icon { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .accent-icon { background: var(--primary-glow); color: var(--primary-color); }

    .bento-detail-title {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-color);
    }

    .count-pill {
      margin-left: auto;
      background: var(--surface-hover);
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .bento-detail-body { display: flex; flex-direction: column; gap: 8px; }
    .bento-empty-text { color: var(--text-muted); font-size: 0.85rem; font-style: italic; }

    .bento-item-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .bento-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .flex-column-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .item-header-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      align-items: center;
    }

    .item-main { display: flex; flex-direction: column; }
    .item-name { font-weight: 600; font-size: 0.9rem; color: var(--text-color); }
    .item-sub { font-size: 0.75rem; color: var(--text-muted); }

    .item-amount { font-weight: 700; font-size: 0.9rem; }
    .positive-val { color: var(--positive-color); }
    .negative-val { color: var(--negative-color); }
    .accent-val { color: var(--primary-color); }

    .item-tags-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .mini-tag { font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .style-tag { background: rgba(92, 107, 192, 0.2); color: #8c9eff; }
    .rate-tag { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .excluded-tag { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .time-filters { display: flex; gap: 6px; }
    .time-filters button { padding: 6px 14px; font-size: 0.85rem; background-color: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: var(--radius-sm); }
    .time-filters button.active { background-color: var(--primary-glow); color: var(--primary-color); border-color: var(--primary-color); font-weight: 600; }
    .time-filters button:hover { background-color: var(--surface-hover); }
  `]
})
export class DashboardPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  projectionService = inject(ProjectionService);
  settings = inject(SettingsService);
  
  summary: DashboardSummaryResponse | null = null;
  customProjection: ProjectionResponse | null = null;
  targetDate: string = '';
  projectionMonths: number = 12; // Default to 1 Year
  showModal = false;

  credits: any[] = [];
  expenses: any[] = [];
  investments: any[] = [];
  
  // Chart Data
  chartLabels: string[] = [];
  chartData: number[] = [];

  constructor() {
    effect(() => {
      const activeId = this.accountState.activeAccountId();
      if (activeId) {
        this.loadDashboard(activeId);
      } else {
        this.summary = null;
        this.customProjection = null;
        this.credits = [];
        this.expenses = [];
        this.investments = [];
      }
    });
  }

  ngOnInit() {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    this.targetDate = d.toISOString().split('T')[0];
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

    this.api.get<any[]>(`/api/v1/credits/account/${accountId}`).subscribe({
      next: (res) => this.credits = res,
      error: (err) => console.error('Failed to load credits', err)
    });

    this.api.get<any[]>(`/api/v1/expenses/account/${accountId}`).subscribe({
      next: (res) => this.expenses = res,
      error: (err) => console.error('Failed to load expenses', err)
    });

    this.api.get<any[]>(`/api/v1/investments/account/${accountId}`).subscribe({
      next: (res) => this.investments = res,
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
      },
      error: (err) => console.error('Failed to load chart data', err)
    });
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
}
