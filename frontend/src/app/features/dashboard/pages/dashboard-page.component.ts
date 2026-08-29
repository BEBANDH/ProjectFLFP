import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountStateService } from '../../../core/services/account-state.service';
import { ProjectionService } from '../services/projection.service';
import { DashboardSummaryResponse, ProjectionResponse } from '../../../shared/models/common-api.models';
import { ProjectionChartComponent } from '../components/projection-chart/projection-chart.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectionChartComponent],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Financial Projection Engine</h1>
        <p class="subtitle">Real-time wealth simulation</p>
      </header>

      <div class="content-grid" *ngIf="summary">
        <!-- Balance Cards -->
        <div class="cards-section">
          <div class="card baseline">
            <h3>Current Baseline</h3>
            <div class="amount">{{ summary.currentBalance | currency }}</div>
          </div>
          <div class="card projection">
            <h3>+30 Days Projection</h3>
            <div class="amount">{{ summary.projectedBalance30Days | currency }}</div>
          </div>
          <div class="card projection">
            <h3>+365 Days Projection</h3>
            <div class="amount">{{ summary.projectedBalance1Year | currency }}</div>
          </div>
        </div>
        
        <!-- Interactive Chart -->
        <app-projection-chart 
          [labels]="chartLabels" 
          [data]="chartData">
        </app-projection-chart>

        <!-- Custom Date Simulator -->
        <div class="simulator-section card">
          <h3>Custom Target Date Simulator</h3>
          <div class="simulator-controls">
            <input type="date" [(ngModel)]="targetDate" class="date-picker">
            <button (click)="runSimulation()">Simulate</button>
          </div>
          
          <div class="simulation-result" *ngIf="customProjection">
            <div class="result-row">
              <span>Projected Balance:</span>
              <span class="amount highlight">{{ customProjection.projectedBalance | currency }}</span>
            </div>
            <div class="result-row">
              <span>Net Variance (Δ):</span>
              <span class="amount" [ngClass]="{'positive': customProjection.deltaVariance >= 0, 'negative': customProjection.deltaVariance < 0}">
                {{ customProjection.deltaVariance > 0 ? '+' : '' }}{{ customProjection.deltaVariance | currency }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="!summary" class="loading-state">
        <p>Loading portfolio data...</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { display: flex; flex-direction: column; gap: 20px; }
    .dashboard-header h1 { margin: 0; color: var(--primary-color); }
    .subtitle { color: var(--text-muted); margin-top: 5px; }
    
    .content-grid { display: flex; flex-direction: column; gap: 20px; }
    
    .cards-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
    
    .card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }
    
    .card h3 { margin-top: 0; font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; }
    .card .amount { font-size: 1.8rem; font-weight: bold; }
    
    .baseline { border-top: 3px solid var(--primary-color); }
    .projection { border-top: 3px solid var(--positive-color); }
    
    .simulator-controls { display: flex; gap: 10px; margin-bottom: 20px; }
    .date-picker { flex: 1; max-width: 200px; }
    
    .simulation-result { background-color: #2a2a2a; padding: 15px; border-radius: 6px; }
    .result-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 1.1rem; }
    .result-row:last-child { margin-bottom: 0; }
    
    .highlight { color: var(--primary-color); }
    .positive { color: var(--positive-color); }
    .negative { color: var(--negative-color); }
  `]
})
export class DashboardPageComponent implements OnInit {
  
  accountState = inject(AccountStateService);
  projectionService = inject(ProjectionService);
  
  summary: DashboardSummaryResponse | null = null;
  customProjection: ProjectionResponse | null = null;
  targetDate: string = '';
  
  // Chart Data
  chartLabels: string[] = [];
  chartData: number[] = [];

  constructor() {
    // Reactively refresh dashboard when active account changes
    effect(() => {
      const activeId = this.accountState.activeAccountId();
      if (activeId) {
        this.loadDashboard(activeId);
      } else {
        this.summary = null;
        this.customProjection = null;
      }
    });
  }

  ngOnInit() {
    // Set default target date to 6 months from today
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    this.targetDate = d.toISOString().split('T')[0];
  }

  loadDashboard(accountId: number) {
    this.projectionService.getDashboardSummary(accountId).subscribe({
      next: (res) => {
        this.summary = res;
        this.loadChartData(accountId);
      },
      error: (err) => console.error('Failed to load dashboard summary', err)
    });
  }

  loadChartData(accountId: number) {
    // Generate 12 months of projection data by calling the calculate API for each month end
    const requests: any[] = [];
    const labels: string[] = [];
    
    let currentDate = new Date();
    
    for (let i = 1; i <= 12; i++) {
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

  runSimulation() {
    const activeId = this.accountState.activeAccountId();
    if (!activeId || !this.targetDate) return;
    
    this.projectionService.calculateProjection(activeId, this.targetDate).subscribe({
      next: (res) => this.customProjection = res,
      error: (err) => console.error('Failed to run simulation', err)
    });
  }
}
