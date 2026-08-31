import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';
import { SettingsService } from '../../../core/services/settings.service';

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
          <h3>{{ editingId ? 'Edit Investment' : 'Add New Investment' }}</h3>
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

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="newInv.isExcludedFromPrincipal" name="isExcludedFromPrincipal">
                Exclude initial outflow from base amount (e.g. funded externally)
              </label>
            </div>

            <div class="btn-group">
              <button type="submit" [disabled]="!invForm.form.valid || !accountState.activeAccountId()">
                {{ editingId ? 'Update Investment' : 'Add Investment' }}
              </button>
              <button type="button" class="btn-secondary" *ngIf="editingId" (click)="cancelEdit()">
                Cancel
              </button>
            </div>
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
                <div class="badge-group">
                  <span class="badge">{{ inv.investmentStyle }}</span>
                  <span class="badge excluded-badge" *ngIf="inv.isExcludedFromPrincipal">Excluded from Base Amount</span>
                </div>
              </div>
              <div class="expense-meta">
                <span class="amount">{{ inv.investedAmount | currency:settings.currencyCode() }}</span>
                <span class="interval">&#64; {{ inv.rateOfInterest }}%</span>
              </div>
              <div class="action-buttons">
                <button type="button" class="icon-btn edit-btn" (click)="onEdit(inv)" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button type="button" class="icon-btn delete-btn" (click)="deleteInvestment(inv.id)" title="Delete">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
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
    
    .btn-group { display: flex; gap: 10px; }
    .btn-secondary {
      background-color: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
    }
    .btn-secondary:hover {
      background-color: var(--surface-hover);
    }

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
    
    .action-buttons { display: flex; gap: 6px; align-items: center; }
    .icon-btn {
      background: none;
      border: none;
      padding: 6px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      min-width: unset;
    }
    .edit-btn { color: var(--primary-color); }
    .edit-btn:hover { background-color: var(--primary-glow); }

    .delete-btn { color: var(--negative-color); }
    .delete-btn:hover { background-color: rgba(239, 68, 68, 0.1); }
    
    .empty-state { color: var(--text-muted); font-style: italic; }
    
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class InvestmentListPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  settings = inject(SettingsService);
  
  investments: any[] = [];
  editingId: number | null = null;
  
  newInv = {
    accountId: 0,
    investmentName: '',
    investmentType: 'EQUITY',
    investmentStyle: 'SIP',
    investedAmount: 0,
    rateOfInterest: 0,
    startDate: new Date().toISOString().split('T')[0],
    maturityDate: null as string | null,
    isExcludedFromPrincipal: false
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

  onEdit(inv: any) {
    this.editingId = inv.id;
    this.newInv = {
      accountId: inv.accountId || this.accountState.activeAccountId(),
      investmentName: inv.investmentName,
      investmentType: inv.investmentType,
      investmentStyle: inv.investmentStyle,
      investedAmount: inv.investedAmount,
      rateOfInterest: inv.rateOfInterest,
      startDate: inv.startDate,
      maturityDate: inv.maturityDate,
      isExcludedFromPrincipal: !!inv.isExcludedFromPrincipal
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  onSubmit() {
    const payload = {
      ...this.newInv,
      maturityDate: this.newInv.maturityDate ? this.newInv.maturityDate : null
    };

    if (this.editingId) {
      this.api.put<any>(`/api/v1/investments/${this.editingId}`, payload).subscribe({
        next: (res) => {
          const index = this.investments.findIndex(i => i.id === this.editingId);
          if (index !== -1) {
            this.investments[index] = res;
          }
          this.cancelEdit();
          this.accountState.loadPortfolios();
        },
        error: (err) => console.error('Failed to update investment', err)
      });
    } else {
      this.api.post<any>('/api/v1/investments', payload).subscribe({
        next: (res) => {
          this.investments.push(res);
          this.resetForm();
          this.accountState.loadPortfolios();
        },
        error: (err) => console.error('Failed to create investment', err)
      });
    }
  }

  deleteInvestment(id: number) {
    this.api.delete(`/api/v1/investments/${id}`).subscribe({
      next: () => {
        this.investments = this.investments.filter(i => i.id !== id);
        if (this.editingId === id) {
          this.cancelEdit();
        }
      },
      error: (err) => console.error('Failed to delete investment', err)
    });
  }

  resetForm() {
    this.newInv.investmentName = '';
    this.newInv.investmentType = 'EQUITY';
    this.newInv.investmentStyle = 'SIP';
    this.newInv.investedAmount = 0;
    this.newInv.rateOfInterest = 0;
    this.newInv.startDate = new Date().toISOString().split('T')[0];
    this.newInv.maturityDate = null;
    this.newInv.isExcludedFromPrincipal = false;
  }
}
