import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-expense-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expense-container">
      <header class="page-header">
        <div>
          <h1>Expenses Management</h1>
          <p class="subtitle">Track your instant deductions and recurring obligations.</p>
        </div>
        <button class="export-excel-btn" (click)="exportExcel()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
          Export Excel
        </button>
      </header>

      <div class="split-view">
        <!-- Expense Form -->
        <div class="form-card card">
          <h3>{{ editingId ? 'Edit Expense' : 'Add New Expense' }}</h3>
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

            <div class="btn-group">
              <button type="submit" [disabled]="!expenseForm.form.valid || !accountState.activeAccountId()">
                {{ editingId ? 'Update Expense' : 'Add Expense' }}
              </button>
              <button type="button" class="btn-secondary" *ngIf="editingId" (click)="cancelEdit()">
                Cancel
              </button>
            </div>
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
                <span class="amount">{{ exp.amount | currency:settings.currencyCode() }}</span>
                <span class="interval" *ngIf="exp.expenseType === 'RECURRING'"> / {{ exp.recurrenceInterval | lowercase }}</span>
              </div>
              <div class="action-buttons">
                <button type="button" class="icon-btn edit-btn" (click)="onEdit(exp)" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button type="button" class="icon-btn delete-btn" (click)="deleteExpense(exp.id)" title="Delete">
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
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-header h1 { margin: 0; color: var(--primary-color); }
    .subtitle { color: var(--text-muted); margin-top: 5px; }
    
    .export-excel-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .export-excel-btn:hover { background: rgba(16, 185, 129, 0.25); }

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
    .badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; width: fit-content; }
    .badge.recurring { background-color: rgba(92, 107, 192, 0.2); color: #8c9eff; }
    .badge.instant { background-color: rgba(255, 82, 82, 0.2); color: #ff5252; }
    
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
export class ExpenseListPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  settings = inject(SettingsService);
  exportService = inject(ExportService);
  
  expenses: any[] = [];
  editingId: number | null = null;
  
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

  exportExcel() {
    this.exportService.exportToCsv('expenses_report.csv', this.expenses);
  }

  loadExpenses(accountId: number) {
    this.api.get<any[]>(`/api/v1/expenses/account/${accountId}`).subscribe({
      next: (res) => this.expenses = res,
      error: (err) => console.error('Failed to load expenses', err)
    });
  }

  onEdit(exp: any) {
    this.editingId = exp.id;
    this.newExpense = {
      accountId: exp.accountId || this.accountState.activeAccountId(),
      name: exp.name,
      amount: exp.amount,
      expenseType: exp.expenseType,
      recurrenceInterval: exp.recurrenceInterval || 'MONTHLY',
      startDate: exp.startDate,
      notes: exp.notes || ''
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  onSubmit() {
    if (this.newExpense.expenseType === 'INSTANT') {
      this.newExpense.recurrenceInterval = 'NONE';
    }
    
    if (this.editingId) {
      this.api.put<any>(`/api/v1/expenses/${this.editingId}`, this.newExpense).subscribe({
        next: (res) => {
          const index = this.expenses.findIndex(e => e.id === this.editingId);
          if (index !== -1) {
            this.expenses[index] = res;
          }
          this.cancelEdit();
        },
        error: (err) => console.error('Failed to update expense', err)
      });
    } else {
      this.api.post<any>('/api/v1/expenses', this.newExpense).subscribe({
        next: (res) => {
          this.expenses.push(res);
          this.resetForm();
        },
        error: (err) => console.error('Failed to create expense', err)
      });
    }
  }

  deleteExpense(id: number) {
    this.api.delete(`/api/v1/expenses/${id}`).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.id !== id);
        if (this.editingId === id) {
          this.cancelEdit();
        }
      },
      error: (err) => console.error('Failed to delete expense', err)
    });
  }

  resetForm() {
    this.newExpense.name = '';
    this.newExpense.amount = 0;
    this.newExpense.expenseType = 'RECURRING';
    this.newExpense.recurrenceInterval = 'MONTHLY';
    this.newExpense.startDate = new Date().toISOString().split('T')[0];
    this.newExpense.notes = '';
  }
}
