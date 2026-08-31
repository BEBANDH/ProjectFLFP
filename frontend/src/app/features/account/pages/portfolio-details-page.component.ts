import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService, Portfolio } from '../../../core/services/account-state.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-portfolio-details-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="portfolio-details-container">
      <header class="page-header">
        <h1>Portfolio Settings</h1>
        <p class="subtitle">Manage the active portfolio details.</p>
      </header>

      <div class="card form-card" *ngIf="activePortfolio">
        <h3>Edit Portfolio: {{ activePortfolio.accountName }}</h3>
        
        <form (ngSubmit)="onSubmit()" #editForm="ngForm" class="portfolio-form">
          <div class="form-group">
            <label>Portfolio Name</label>
            <input type="text" [(ngModel)]="formData.accountName" name="accountName" required>
          </div>
          
          <div class="form-group">
            <label>Institution / Bank Name</label>
            <input type="text" [(ngModel)]="formData.bankName" name="bankName" required>
          </div>
          
          <div class="form-group">
            <label>Baseline Amount (Principal / Current Balance)</label>
            <div class="input-with-symbol">
              <span class="currency-symbol">{{ 0 | currency:settings.currencyCode() | slice:0:1 }}</span>
              <input type="number" [(ngModel)]="formData.currentBalance" name="currentBalance" required step="0.01">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="!editForm.form.valid || isSaving">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
            <span class="success-message" *ngIf="showSuccess">✅ Saved successfully!</span>
          </div>
        </form>
      </div>

      <div class="empty-state" *ngIf="!activePortfolio">
        <p>No portfolio selected. Please select or create a portfolio from the top header.</p>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-details-container { display: flex; flex-direction: column; gap: 20px; max-width: 600px; margin: 0 auto; width: 100%; }
    .page-header h1 { margin: 0; color: var(--primary-color); }
    .subtitle { color: var(--text-muted); margin-top: 5px; }
    
    .card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 25px;
    }
    
    .card h3 { margin-top: 0; margin-bottom: 25px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; color: var(--text-muted); text-transform: uppercase; font-size: 0.9rem; }
    
    .form-group { display: flex; flex-direction: column; margin-bottom: 20px; }
    .form-group label { margin-bottom: 8px; font-size: 0.95rem; font-weight: 500; }
    
    .input-with-symbol { display: flex; align-items: center; position: relative; }
    .currency-symbol { position: absolute; left: 12px; color: var(--text-muted); }
    .input-with-symbol input { padding-left: 30px; width: 100%; box-sizing: border-box; }
    
    .form-actions { display: flex; align-items: center; gap: 15px; margin-top: 30px; }
    .success-message { color: var(--positive-color); font-weight: bold; animation: fadeOut 3s forwards; }
    
    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
  `]
})
export class PortfolioDetailsPageComponent implements OnInit {
  
  api = inject(ApiService);
  accountState = inject(AccountStateService);
  settings = inject(SettingsService);
  
  activePortfolio: Portfolio | null = null;
  formData = { accountName: '', bankName: '', currentBalance: 0 };
  
  isSaving = false;
  showSuccess = false;

  constructor() {
    effect(() => {
      const activeId = this.accountState.activeAccountId();
      const portfolios = this.accountState.portfolios();
      
      if (activeId && portfolios.length > 0) {
        const found = portfolios.find(p => p.id === activeId);
        if (found) {
          this.activePortfolio = found;
          // Clone the data to the form
          this.formData = {
            accountName: found.accountName,
            bankName: found.bankName,
            currentBalance: found.currentBalance
          };
        }
      } else {
        this.activePortfolio = null;
      }
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (!this.activePortfolio) return;
    
    this.isSaving = true;
    this.showSuccess = false;
    
    this.api.put(`/api/v1/accounts/${this.activePortfolio.id}`, this.formData).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccess = true;
        // Reload global portfolio state so header updates
        this.accountState.loadPortfolios();
        
        setTimeout(() => this.showSuccess = false, 3000);
      },
      error: (err) => {
        console.error('Failed to update portfolio', err);
        this.isSaving = false;
      }
    });
  }
}
