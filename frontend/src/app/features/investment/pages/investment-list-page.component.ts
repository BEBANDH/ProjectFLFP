import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';

@Component({
  selector: 'app-investment-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expense-container">
      <header class="page-header">
        <h1>Investments</h1>
        <p class="subtitle">Track compounding wealth vehicles.</p>
      </header>

      <div class="split-view">
        <!-- Investment Form -->
        <div class="form-card card">
          <h3>Add New Investment</h3>
          <form (ngSubmit)="onSubmit()" #invForm="ngForm" class="expense-form">
            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="newInv.investmentName" name="investmentName" required>
            </div>

            <div class="form-group">
              <label>Type</label>
              <select [(ngModel)]="newInv.investmentType" name="investmentType" required>
                <option value="EQUITY">Equity</option>
                <option value="REAL_ESTATE">Real Estate</option>
                <option value="FIXED_DEPOSIT">Fixed Deposit</option>
              </select>
            </div>

            <div class="form-group">
              <label>Style</label>
              <select [(ngModel)]="newInv.investmentStyle" name="investmentStyle" required>
                <option value="SIP">SIP (Monthly Deduction)</option>
                <option value="ONE_TIME">One Time Lumpsum</option>
              </select>
            </div>

            <div class="form-group">
              <label>Invested Amount</label>
              <input type="number" [(ngModel)]="newInv.investedAmount" name="investedAmount" required min="0.01" step="0.01">
            </div>

            <div class="form-group">
              <label>Interest Rate (%)</label>
              <input type="number" [(ngModel)]="newInv.rateOfInterest" name="rateOfInterest" required min="0" step="0.1">
            </div>

            <div class="form-group">
              <label>Start Date</label>
              <input type="date" [(ngModel)]="newInv.startDate" name="startDate" required>
            </div>

            <div class="form-group">
              <label>Maturity Date (Optional)</label>
              <input type="date" [(ngModel)]="newInv.maturityDate" name="maturityDate">
            </div>

            <button type="submit" [disabled]="!invForm.form.valid || !accountState.activeAccountId()">
              Add Investment
            </button>
          </form>
        </div>

        <!-- Investment List -->
        <div class="list-card card">
          <h3>Active Investments</h3>
          <div *ngIf="investments.length === 0" class="empty-state">
            No investments found for this account.
          </div>
          
          <ul class="expense-list" *ngIf="investments.length > 0">
            <li *ngFor="let inv of investments" class="expense-item">
              <div class="expense-info">
                <strong>{{ inv.investmentName }}</strong>
                <span class="badge">{{ inv.investmentStyle }}</span>
              </div>
              <div class="expense-meta">
                <span class="amount">{{ inv.investedAmount | currency }}</span>
                <span class="interval">@ {{ inv.rateOfInterest }}%</span>
              </div>
              <button class="delete-btn" (click)="deleteInvestment(inv.id)">✕</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expense-container { display: flex; flex-direction: column; gap: 20px; }
    .page-header h1 { margin: 0; color: var(--primary-color); }
    .subtitle { color: var(--text-muted); margin-top: 5px; }
    
    .split-view { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    
    .card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
    }
    
    .card h3 { margin-top: 0; color: var(--text-muted); text-transform: uppercase; font-size: 0.9rem; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
    
    .form-group { display: flex; flex-direction: column; margin-bottom: 15px; }
    .form-group label { margin-bottom: 5px; font-size: 0.9rem; color: #ccc; }
    
    .expense-list { list-style: none; padding: 0; margin: 0; }
    .expense-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 12px 0; border-bottom: 1px solid var(--border-color); 
    }
    .expense-item:last-child { border-bottom: none; }
    
    .expense-info { display: flex; flex-direction: column; gap: 4px; }
    .badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; width: fit-content; background-color: rgba(92, 107, 192, 0.2); color: #8c9eff; }
    
    .expense-meta { margin-left: auto; margin-right: 15px; text-align: right; }
    .amount { font-weight: bold; }
    .interval { color: var(--text-muted); font-size: 0.8rem; }
    
    .delete-btn { background: none; color: var(--negative-color); font-size: 1.2rem; padding: 0 5px; }
    .delete-btn:hover { background-color: rgba(255, 82, 82, 0.1); }
    
    .empty-state { color: var(--text-muted); font-style: italic; }
    
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class InvestmentListPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  
  investments: any[] = [];
  
  newInv = {
    accountId: 0,
    investmentName: '',
    investmentType: 'EQUITY',
    investmentStyle: 'SIP',
    investedAmount: 0,
    rateOfInterest: 0,
    startDate: new Date().toISOString().split('T')[0],
    maturityDate: null
  };

  constructor() {
    effect(() => {
      const activeId = this.accountState.activeAccountId();
      if (activeId) {
        this.newInv.accountId = activeId;
        this.loadInvestments(activeId);
      } else {
        this.investments = [];
      }
    });
  }

  ngOnInit() {}

  loadInvestments(accountId: number) {
    this.api.get<any[]>(`/api/v1/investments/account/${accountId}`).subscribe({
      next: (res) => this.investments = res,
      error: (err) => console.error('Failed to load investments', err)
    });
  }

  onSubmit() {
    this.api.post<any>('/api/v1/investments', this.newInv).subscribe({
      next: (res) => {
        this.investments.push(res);
        this.resetForm();
      },
      error: (err) => console.error('Failed to create investment', err)
    });
  }

  deleteInvestment(id: number) {
    this.api.delete(`/api/v1/investments/${id}`).subscribe({
      next: () => {
        this.investments = this.investments.filter(i => i.id !== id);
      },
      error: (err) => console.error('Failed to delete investment', err)
    });
  }

  resetForm() {
    this.newInv.investmentName = '';
    this.newInv.investedAmount = 0;
    this.newInv.rateOfInterest = 0;
  }
}
