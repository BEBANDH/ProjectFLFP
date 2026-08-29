import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';

@Component({
  selector: 'app-expense-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expense-container">
      <header class="page-header">
        <h1>Expenses Management</h1>
        <p class="subtitle">Track your instant deductions and recurring obligations.</p>
      </header>

      <div class="split-view">
        <!-- Expense Form -->
        <div class="form-card card">
          <h3>Add New Expense</h3>
          <form (ngSubmit)="onSubmit()" #expenseForm="ngForm" class="expense-form">
            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="newExpense.name" name="name" required placeholder="e.g. Rent, Groceries">
            </div>

            <div class="form-group">
              <label>Amount</label>
              <input type="number" [(ngModel)]="newExpense.amount" name="amount" required min="0.01" step="0.01">
            </div>

            <div class="form-group">
              <label>Type</label>
              <select [(ngModel)]="newExpense.expenseType" name="expenseType" required>
                <option value="RECURRING">Recurring (Projected over time)</option>
                <option value="INSTANT">Instant (Deducted immediately)</option>
              </select>
            </div>

            <div class="form-group" *ngIf="newExpense.expenseType === 'RECURRING'">
              <label>Recurrence Interval</label>
              <select [(ngModel)]="newExpense.recurrenceInterval" name="recurrenceInterval">
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>

            <div class="form-group">
              <label>Start Date</label>
              <input type="date" [(ngModel)]="newExpense.startDate" name="startDate" required>
            </div>

            <button type="submit" [disabled]="!expenseForm.form.valid || !accountState.activeAccountId()">
              Add Expense
            </button>
          </form>
        </div>

        <!-- Expense List -->
        <div class="list-card card">
          <h3>Active Expenses</h3>
          <div *ngIf="expenses.length === 0" class="empty-state">
            No expenses found for this account.
          </div>
          
          <ul class="expense-list" *ngIf="expenses.length > 0">
            <li *ngFor="let exp of expenses" class="expense-item">
              <div class="expense-info">
                <strong>{{ exp.name }}</strong>
                <span class="badge" [ngClass]="exp.expenseType.toLowerCase()">{{ exp.expenseType }}</span>
              </div>
              <div class="expense-meta">
                <span class="amount">{{ exp.amount | currency }}</span>
                <span class="interval" *ngIf="exp.expenseType === 'RECURRING'"> / {{ exp.recurrenceInterval | lowercase }}</span>
              </div>
              <button class="delete-btn" (click)="deleteExpense(exp.id)">✕</button>
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
    .badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; width: fit-content; }
    .badge.recurring { background-color: rgba(92, 107, 192, 0.2); color: #8c9eff; }
    .badge.instant { background-color: rgba(255, 82, 82, 0.2); color: #ff5252; }
    
    .expense-meta { margin-left: auto; margin-right: 15px; text-align: right; }
    .amount { font-weight: bold; }
    .interval { color: var(--text-muted); font-size: 0.8rem; }
    
    .delete-btn { background: none; color: var(--negative-color); font-size: 1.2rem; padding: 0 5px; }
    .delete-btn:hover { background-color: rgba(255, 82, 82, 0.1); }
    
    .empty-state { color: var(--text-muted); font-style: italic; }
    
    button[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ExpenseListPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  
  expenses: any[] = [];
  
  newExpense = {
    accountId: 0,
    name: '',
    amount: 0,
    expenseType: 'RECURRING',
    recurrenceInterval: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  };

  constructor() {
    effect(() => {
      const activeId = this.accountState.activeAccountId();
      if (activeId) {
        this.newExpense.accountId = activeId;
        this.loadExpenses(activeId);
      } else {
        this.expenses = [];
      }
    });
  }

  ngOnInit() {}

  loadExpenses(accountId: number) {
    this.api.get<any[]>(`/api/v1/expenses/account/${accountId}`).subscribe({
      next: (res) => this.expenses = res,
      error: (err) => console.error('Failed to load expenses', err)
    });
  }

  onSubmit() {
    if (this.newExpense.expenseType === 'INSTANT') {
      this.newExpense.recurrenceInterval = 'NONE';
    }
    
    this.api.post<any>('/api/v1/expenses', this.newExpense).subscribe({
      next: (res) => {
        this.expenses.push(res);
        this.resetForm();
      },
      error: (err) => console.error('Failed to create expense', err)
    });
  }

  deleteExpense(id: number) {
    this.api.delete(`/api/v1/expenses/${id}`).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.id !== id);
      },
      error: (err) => console.error('Failed to delete expense', err)
    });
  }

  resetForm() {
    this.newExpense.name = '';
    this.newExpense.amount = 0;
  }
}
