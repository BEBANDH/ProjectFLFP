import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AccountStateService } from '../../../core/services/account-state.service';

@Component({
  selector: 'app-portfolio-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop">
      <div class="modal-content">
        <header class="modal-header">
          <h2>Create New Portfolio</h2>
          <button class="close-btn" (click)="close()">✕</button>
        </header>
        
        <form (ngSubmit)="onSubmit()" #pForm="ngForm" class="portfolio-form">
          <div class="form-group">
            <label>Portfolio Name</label>
            <input type="text" [(ngModel)]="newPortfolio.accountName" name="accountName" placeholder="e.g. My Main Wealth" required>
          </div>
          
          <div class="form-group">
            <label>Institution / Bank Name</label>
            <input type="text" [(ngModel)]="newPortfolio.bankName" name="bankName" placeholder="e.g. Chase Bank" required>
          </div>
          
          <div class="form-group">
            <label>Baseline Amount (Current Balance)</label>
            <input type="number" [(ngModel)]="newPortfolio.currentBalance" name="currentBalance" required min="0" step="0.01">
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-cancel" (click)="close()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="!pForm.form.valid">Create Portfolio</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 25px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    
    .modal-header h2 { margin: 0; color: var(--primary-color); font-size: 1.2rem; }
    
    .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }
    .close-btn:hover { color: #fff; }
    
    .form-group { display: flex; flex-direction: column; margin-bottom: 15px; }
    .form-group label { margin-bottom: 5px; font-size: 0.9rem; color: #ccc; }
    
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    
    .btn-cancel { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); }
    .btn-cancel:hover { background: rgba(255,255,255,0.1); }
  `]
})
export class PortfolioModalComponent {
  
  @Output() closed = new EventEmitter<void>();
  @Output() portfolioCreated = new EventEmitter<void>();
  
  private api = inject(ApiService);
  private accountState = inject(AccountStateService);
  
  newPortfolio = {
    userId: 999, // Dummy User ID
    accountName: '',
    bankName: '',
    currentBalance: 0
  };

  close() {
    this.closed.emit();
  }

  onSubmit() {
    this.api.post('/api/v1/accounts', this.newPortfolio).subscribe({
      next: () => {
        // Refresh the portfolio list in global state
        this.accountState.loadPortfolios();
        this.portfolioCreated.emit();
        this.close();
      },
      error: (err) => console.error('Failed to create portfolio', err)
    });
  }
}
