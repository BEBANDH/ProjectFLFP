import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/pages/landing-page.component').then(m => m.LandingPageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/pages/dashboard-page.component').then(m => m.DashboardPageComponent)
  },
  {
    path: 'portfolio',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/pages/portfolio-details-page.component').then(m => m.PortfolioDetailsPageComponent)
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    loadComponent: () => import('./features/expense/pages/expense-list-page.component').then(m => m.ExpenseListPageComponent)
  },
  {
    path: 'credits',
    canActivate: [authGuard],
    loadComponent: () => import('./features/credit/pages/credit-list-page.component').then(m => m.CreditListPageComponent)
  },
  {
    path: 'investments',
    canActivate: [authGuard],
    loadComponent: () => import('./features/investment/pages/investment-list-page.component').then(m => m.InvestmentListPageComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/pages/settings-page.component').then(m => m.SettingsPageComponent)
  }
];

