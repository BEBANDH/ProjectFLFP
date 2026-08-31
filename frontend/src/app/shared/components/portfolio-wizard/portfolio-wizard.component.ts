import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';

@Component({
  selector: 'app-portfolio-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="wizard-modal" (click)="$event.stopPropagation()">
        <!-- Wizard Stepper Header -->
        <div class="wizard-header">
          <div class="step-indicator">Step {{ currentStep }} of 4</div>
          <h3>Guided Portfolio Setup</h3>
          <div class="stepper-bar">
            <div class="stepper-fill" [style.width.%]="currentStep * 25"></div>
          </div>
        </div>

        <div class="wizard-body">
          <!-- Step 1: Account Details -->
          <div *ngIf="currentStep === 1" class="step-content">
            <h4>1. Portfolio & Baseline Balance</h4>
            <p class="subtitle">Set your account name and starting cash baseline.</p>
            <div class="form-group">
              <label>Account / Portfolio Name</label>
              <input type="text" [(ngModel)]="accountName" placeholder="e.g. Primary Wealth Reserve" required>
            </div>
            <div class="form-group">
              <label>Financial Institution / Bank</label>
              <input type="text" [(ngModel)]="bankName" placeholder="e.g. Chase / HDFC / Vanguard" required>
            </div>
            <div class="form-group">
              <label>Starting Cash Balance ($)</label>
              <input type="number" [(ngModel)]="currentBalance" placeholder="10000" required>
            </div>
          </div>

          <!-- Step 2: Primary Income Stream -->
          <div *ngIf="currentStep === 2" class="step-content">
            <h4>2. Monthly Income & Credits</h4>
            <p class="subtitle">Log your primary salary or recurring income stream.</p>
            <div class="form-group">
              <label>Income Source Name</label>
              <input type="text" [(ngModel)]="incomeName" placeholder="e.g. Software Engineer Salary">
            </div>
            <div class="form-group">
              <label>Monthly Amount ($)</label>
              <input type="number" [(ngModel)]="incomeAmount" placeholder="5000">
            </div>
          </div>

          <!-- Step 3: Core Expenses -->
          <div *ngIf="currentStep === 3" class="step-content">
            <h4>3. Recurring Monthly Expenses</h4>
            <p class="subtitle">Log your primary monthly living expenses.</p>
            <div class="form-group">
              <label>Expense Name</label>
              <input type="text" [(ngModel)]="expenseName" placeholder="e.g. Rent & Utilities">
            </div>
            <div class="form-group">
              <label>Monthly Amount ($)</label>
              <input type="number" [(ngModel)]="expenseAmount" placeholder="1800">
            </div>
          </div>

          <!-- Step 4: Initial Investment -->
          <div *ngIf="currentStep === 4" class="step-content">
            <h4>4. Investment Vehicle (SIP / FD)</h4>
            <p class="subtitle">Optionally add a compounding growth investment vehicle.</p>
            <div class="form-group">
              <label>Investment Name</label>
              <input type="text" [(ngModel)]="investmentName" placeholder="e.g. S&P 500 Index Fund">
            </div>
            <div class="form-group">
              <label>Invested Amount ($)</label>
              <input type="number" [(ngModel)]="investedAmount" placeholder="10000">
            </div>
            <div class="form-group">
              <label>Expected Annual Return (%)</label>
              <input type="number" [(ngModel)]="returnRate" placeholder="10.5">
            </div>
          </div>
        </div>

        <div class="wizard-footer">
          <button *ngIf="currentStep > 1" class="btn-secondary" (click)="currentStep = currentStep - 1">Back</button>
          <button *ngIf="currentStep < 4" class="btn-primary" [disabled]="!canProceed()" (click)="currentStep = currentStep + 1">Next Step</button>
          <button *ngIf="currentStep === 4" class="btn-primary success-btn" (click)="finishWizard()">Finish & Launch Portfolio</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .wizard-modal {
      width: 100%;
      max-width: 520px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: var(--shadow-lg);
    }
    .step-indicator { font-size: 0.75rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; }
    .wizard-header h3 { margin: 4px 0 12px 0; color: var(--text-color); }
    .stepper-bar { background: var(--surface-hover); height: 6px; border-radius: 3px; overflow: hidden; }
    .stepper-fill { background: var(--primary-color); height: 100%; transition: width 0.3s ease; }
    .step-content { display: flex; flex-direction: column; gap: 14px; }
    .step-content h4 { margin: 0; color: var(--text-color); }
    .subtitle { color: var(--text-muted); font-size: 0.85rem; margin-top: -6px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
    .form-group input { padding: 10px 12px; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-color); border-radius: var(--radius-md); font-family: inherit; }
    .wizard-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
    .btn-primary { background: var(--primary-color); color: #fff; border: none; padding: 10px 20px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: var(--surface-hover); color: var(--text-color); border: 1px solid var(--border-color); padding: 10px 20px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; }
    .success-btn { background: var(--positive-color); }
  `]
})
export class PortfolioWizardComponent {
  @Output() close = new EventEmitter<void>();

  api = inject(ApiService);
  accountState = inject(AccountStateService);

  currentStep = 1;

  accountName = '';
  bankName = '';
  currentBalance = 10000;

  incomeName = 'Monthly Salary';
  incomeAmount = 5000;

  expenseName = 'Monthly Living Expenses';
  expenseAmount = 1800;

  investmentName = 'Index Fund SIP';
  investedAmount = 5000;
  returnRate = 10;

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return !!this.accountName.trim() && !!this.bankName.trim() && this.currentBalance >= 0;
    }
    return true;
  }

  finishWizard() {
    // Create Account
    this.api.post<any>('/api/v1/accounts', {
      accountName: this.accountName,
      bankName: this.bankName,
      currentBalance: this.currentBalance
    }).subscribe({
      next: (acc) => {
        const accountId = acc.id;

        // Optionally add Credit
        if (this.incomeName && this.incomeAmount > 0) {
          this.api.post('/api/v1/credits', {
            accountId: accountId,
            sourceName: this.incomeName,
            amount: this.incomeAmount,
            recurrenceInterval: 'MONTHLY',
            startDate: new Date().toISOString().split('T')[0]
          }).subscribe();
        }

        // Optionally add Expense
        if (this.expenseName && this.expenseAmount > 0) {
          this.api.post('/api/v1/expenses', {
            accountId: accountId,
            name: this.expenseName,
            amount: this.expenseAmount,
            expenseType: 'RECURRING',
            recurrenceInterval: 'MONTHLY',
            startDate: new Date().toISOString().split('T')[0]
          }).subscribe();
        }

        // Optionally add Investment
        if (this.investmentName && this.investedAmount > 0) {
          const startDate = new Date();
          const maturityDate = new Date();
          maturityDate.setFullYear(startDate.getFullYear() + 5);

          this.api.post('/api/v1/investments', {
            accountId: accountId,
            investmentName: this.investmentName,
            investedAmount: this.investedAmount,
            investmentType: 'SIP',
            investmentStyle: 'MUTUAL_FUND',
            rateOfInterest: this.returnRate,
            startDate: startDate.toISOString().split('T')[0],
            maturityDate: maturityDate.toISOString().split('T')[0],
            isExcludedFromPrincipal: false
          }).subscribe();
        }

        this.accountState.loadAccounts();
        this.close.emit();
      },
      error: (err) => console.error('Wizard failed to create portfolio', err)
    });
  }
}
