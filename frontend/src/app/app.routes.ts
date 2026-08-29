import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/pages/dashboard-page.component').then(m => m.DashboardPageComponent)
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expense/pages/expense-list-page.component').then(m => m.ExpenseListPageComponent)
  },
  {
    path: 'credits',
    loadComponent: () => import('./features/credit/pages/credit-list-page.component').then(m => m.CreditListPageComponent)
  },
  {
    path: 'investments',
    loadComponent: () => import('./features/investment/pages/investment-list-page.component').then(m => m.InvestmentListPageComponent)
  }
];
