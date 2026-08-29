import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';

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
          <h3>Add New Income Stream</h3>
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

            <button type="submit" [disabled]="!creditForm.form.valid || !accountState.activeAccountId()">
              Add Income
            </button>
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
                <span class="amount" style="color: var(--positive-color)">+{{ credit.amount | currency }}</span>
                <span class="interval"> / {{ credit.recurrenceInterval | lowercase }}</span>
              </div>
              <button class="delete-btn" (click)="deleteCredit(credit.id)">✕</button>
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
    
    .expense-meta { margin-left: auto; margin-right: 15px; text-align: right; }
    .amount { font-weight: bold; }
    .interval { color: var(--text-muted); font-size: 0.8rem; }
    
    .delete-btn { background: none; color: var(--negative-color); font-size: 1.2rem; padding: 0 5px; }
    .delete-btn:hover { background-color: rgba(255, 82, 82, 0.1); }
    
    .empty-state { color: var(--text-muted); font-style: italic; }
    
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class CreditListPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  
  credits: any[] = [];
  
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

  onSubmit() {
    this.api.post<any>('/api/v1/credits', this.newCredit).subscribe({
      next: (res) => {
        this.credits.push(res);
        this.resetForm();
      },
      error: (err) => console.error('Failed to create credit', err)
    });
  }

  deleteCredit(id: number) {
    this.api.delete(`/api/v1/credits/${id}`).subscribe({
      next: () => {
        this.credits = this.credits.filter(c => c.id !== id);
      },
      error: (err) => console.error('Failed to delete credit', err)
    });
  }

  resetForm() {
    this.newCredit.sourceName = '';
    this.newCredit.amount = 0;
  }
}
