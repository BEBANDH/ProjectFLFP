import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccountStateService {
  
  // Angular Signal holding the currently active account ID globally
  // Temporarily set to a dummy account ID (1) until auth is implemented
  public activeAccountId = signal<number | null>(1);

  constructor() { }

  setActiveAccount(id: number) {
    this.activeAccountId.set(id);
  }
  
  clearActiveAccount() {
    this.activeAccountId.set(null);
  }
}
