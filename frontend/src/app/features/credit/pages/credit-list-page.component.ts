import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-credit-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expense-container">
      <header class="page-header">
        <h1>Income & Credits</h1>
        <p class="subtitle">Track your recurring income streams.</p>
      </header>

      <div class="split-view">
        <!-- Credit Form -->
        <div class="form-card card">
          <h3>{{ editingId ? 'Edit Income Stream' : 'Add New Income Stream' }}</h3>
          <form (ngSubmit)="onSubmit()" #creditForm="ngForm" class="expense-form">
            <div class="form-group">
              <label>Source Name</label>
              <input type="text" [(ngModel)]="newCredit.sourceName" name="sourceName" required placeholder="e.g. Salary, Dividends">
            </div>

            <div class="form-group">
              <label>Amount</label>
              <input type="number" [(ngModel)]="newCredit.amount" name="amount" required min="0.01" step="0.01">
            </div>

            <div class="form-group">
              <label>Recurrence Interval</label>
              <select [(ngModel)]="newCredit.recurrenceInterval" name="recurrenceInterval">
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>

            <div class="form-group">
              <label>Start Date</label>
              <input type="date" [(ngModel)]="newCredit.startDate" name="startDate" required>
            </div>

            <div class="btn-group">
              <button type="submit" [disabled]="!creditForm.form.valid || !accountState.activeAccountId()">
                {{ editingId ? 'Update Income' : 'Add Income' }}
              </button>
              <button type="button" class="btn-secondary" *ngIf="editingId" (click)="cancelEdit()">
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Credit List -->
        <div class="list-card card">
          <h3>Active Income Streams</h3>
          <div *ngIf="credits.length === 0" class="empty-state">
            No income streams found for this account.
          </div>
          
          <ul class="expense-list" *ngIf="credits.length > 0">
            <li *ngFor="let credit of credits" class="expense-item">
              <div class="expense-info">
                <strong>{{ credit.sourceName }}</strong>
              </div>
              <div class="expense-meta">
                <span class="amount" style="color: var(--positive-color)">+{{ credit.amount | currency:settings.currencyCode() }}</span>
                <span class="interval"> / {{ credit.recurrenceInterval | lowercase }}</span>
              </div>
              <div class="action-buttons">
                <button type="button" class="icon-btn edit-btn" (click)="onEdit(credit)" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button type="button" class="icon-btn delete-btn" (click)="deleteCredit(credit.id)" title="Delete">
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
export class CreditListPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  settings = inject(SettingsService);
  
  credits: any[] = [];
  editingId: number | null = null;
  
  newCredit = {
    accountId: 0,
    sourceName: '',
    amount: 0,
    recurrenceInterval: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0]
  };

  constructor() {
    effect(() => {
      const activeId = this.accountState.activeAccountId();
      if (activeId) {
        this.newCredit.accountId = activeId;
        this.loadCredits(activeId);
      } else {
        this.credits = [];
      }
    });
  }

  ngOnInit() {}

  loadCredits(accountId: number) {
    this.api.get<any[]>(`/api/v1/credits/account/${accountId}`).subscribe({
      next: (res) => this.credits = res,
      error: (err) => console.error('Failed to load credits', err)
    });
  }

  onEdit(credit: any) {
    this.editingId = credit.id;
    this.newCredit = {
      accountId: credit.accountId || this.accountState.activeAccountId(),
      sourceName: credit.sourceName,
      amount: credit.amount,
      recurrenceInterval: credit.recurrenceInterval || 'MONTHLY',
      startDate: credit.startDate
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  onSubmit() {
    if (this.editingId) {
      this.api.put<any>(`/api/v1/credits/${this.editingId}`, this.newCredit).subscribe({
        next: (res) => {
          const index = this.credits.findIndex(c => c.id === this.editingId);
          if (index !== -1) {
            this.credits[index] = res;
          }
          this.cancelEdit();
        },
        error: (err) => console.error('Failed to update credit', err)
      });
    } else {
      this.api.post<any>('/api/v1/credits', this.newCredit).subscribe({
        next: (res) => {
          this.credits.push(res);
          this.resetForm();
        },
        error: (err) => console.error('Failed to create credit', err)
      });
    }
  }

  deleteCredit(id: number) {
    this.api.delete(`/api/v1/credits/${id}`).subscribe({
      next: () => {
        this.credits = this.credits.filter(c => c.id !== id);
        if (this.editingId === id) {
          this.cancelEdit();
        }
      },
      error: (err) => console.error('Failed to delete credit', err)
    });
  }

  resetForm() {
    this.newCredit.sourceName = '';
    this.newCredit.amount = 0;
    this.newCredit.recurrenceInterval = 'MONTHLY';
    this.newCredit.startDate = new Date().toISOString().split('T')[0];
  }
}
