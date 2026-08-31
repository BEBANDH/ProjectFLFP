import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AccountStateService } from './account-state.service';

export interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private accountState = inject(AccountStateService);
  private apiUrl = `/api/v1/auth`;
  
  // State
  isAuthenticated = signal<boolean>(false);
  currentUserEmail = signal<string | null>(null);

  constructor() {
    this.checkToken();
  }

  private checkToken() {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        this.isAuthenticated.set(true);
        this.currentUserEmail.set(decoded.sub);
        this.accountState.loadPortfolios();
      } else {
        this.logout(); // Token expired
      }
    }
  }

  register(credentials: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, credentials).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  login(credentials: any) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/authenticate`, credentials).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this.isAuthenticated.set(false);
    this.currentUserEmail.set(null);
    this.accountState.clearActiveAccount();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private handleAuthResponse(response: AuthResponse) {
    localStorage.setItem('jwt_token', response.token);
    const decoded = this.decodeToken(response.token);
    this.isAuthenticated.set(true);
    if (decoded) {
      this.currentUserEmail.set(decoded.sub);
    }
    
    // Once logged in, refresh the global state (portfolios, etc)
    this.accountState.loadPortfolios();
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
