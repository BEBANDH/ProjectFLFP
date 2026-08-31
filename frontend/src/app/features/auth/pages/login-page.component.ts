import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>{{ isLoginMode ? 'Welcome Back' : 'Create Account' }}</h2>
        <p class="subtitle">{{ isLoginMode ? 'Log in to manage your portfolio' : 'Sign up to get started' }}</p>

        <form (ngSubmit)="onSubmit()" #authForm="ngForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email" 
              required 
              email
              placeholder="you@example.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="password" 
              required 
              minlength="6"
              placeholder="••••••••"
            />
          </div>

          <div *ngIf="errorMessage()" class="error-alert">
            {{ errorMessage() }}
          </div>

          <button type="submit" class="btn-submit" [disabled]="!authForm.valid || isLoading()">
            <span *ngIf="isLoading()">Please wait...</span>
            <span *ngIf="!isLoading()">{{ isLoginMode ? 'Log In' : 'Sign Up' }}</span>
          </button>
        </form>

        <div class="auth-toggle">
          <p>
            {{ isLoginMode ? "Don't have an account?" : 'Already have an account?' }}
            <button class="btn-link" (click)="toggleMode()" type="button">
              {{ isLoginMode ? 'Sign up' : 'Log in' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: var(--bg-color);
    }
    
    .auth-card {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }

    h2 {
      margin-top: 0;
      margin-bottom: 5px;
      color: var(--primary-color);
      text-align: center;
    }

    .subtitle {
      text-align: center;
      color: var(--text-muted);
      margin-bottom: 30px;
      font-size: 0.95rem;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-color);
    }

    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background-color: var(--input-bg);
      color: var(--text-color);
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .error-alert {
      background-color: rgba(255, 69, 58, 0.1);
      color: #ff453a;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      border: 1px solid rgba(255, 69, 58, 0.3);
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: var(--secondary-color);
    }
    
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .auth-toggle {
      margin-top: 25px;
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--primary-color);
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-size: 0.9rem;
    }
    
    .btn-link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoginMode = true;
  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage.set(null);
  }

  onSubmit() {
    if (!this.email || !this.password) return;
    
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = { email: this.email, password: this.password };
    const authObs = this.isLoginMode 
      ? this.authService.login(credentials)
      : this.authService.register(credentials);

    authObs.subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.status === 403 || err.status === 401
            ? 'Invalid email or password.'
            : 'An error occurred. Please try again later.'
        );
      }
    });
  }
}
