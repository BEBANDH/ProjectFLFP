import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface Portfolio {
  id: number;
  userId: number;
  accountName: string;
  bankName: string;
  currentBalance: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountStateService {
  
  private api = inject(ApiService);
  
  public portfolios = signal<Portfolio[]>([]);
  public activeAccountId = signal<number | null>(null);

  constructor() {
    // Portfolios are loaded by AuthService after login/token check
  }

  loadPortfolios() {
    this.api.get<Portfolio[]>(`/api/v1/accounts/my-accounts`).subscribe({
      next: (data) => {
        this.portfolios.set(data);
        if (data.length > 0 && !this.activeAccountId()) {
          this.activeAccountId.set(data[0].id);
        } else if (data.length === 0) {
          this.activeAccountId.set(null);
        }
      },
      error: (err) => console.error('Failed to load portfolios', err)
    });
  }

  setActiveAccount(id: number) {
    this.activeAccountId.set(id);
  }
  
  clearActiveAccount() {
    this.activeAccountId.set(null);
  }
}
