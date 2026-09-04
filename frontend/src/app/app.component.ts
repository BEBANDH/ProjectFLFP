import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountStateService } from './core/services/account-state.service';
import { SettingsService } from './core/services/settings.service';
import { AuthService } from './core/services/auth.service';
import { KeyboardShortcutsService } from './core/services/keyboard-shortcuts.service';
import { PortfolioModalComponent } from './shared/components/portfolio-modal/portfolio-modal.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, PortfolioModalComponent, CommandPaletteComponent],
  template: `
    <div class="app-layout" [class.is-auth-page]="!authService.isAuthenticated()">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="isSidebarCollapsed()" *ngIf="authService.isAuthenticated()">
        <div class="sidebar-header">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <h2 *ngIf="!isSidebarCollapsed()">FLFP</h2>
          <button class="collapse-toggle-btn" (click)="toggleSidebar()" title="Toggle Sidebar (Compact View)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline [attr.points]="isSidebarCollapsed() ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"></polyline>
            </svg>
          </button>
        </div>
        <nav>
          <div class="nav-section-label" *ngIf="!isSidebarCollapsed()">Core</div>
          <ul>
            <li>
              <a routerLink="/dashboard" routerLinkActive="active" [title]="isSidebarCollapsed() ? 'Dashboard' : ''">
                <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
                <span *ngIf="!isSidebarCollapsed()">Dashboard</span>
              </a>
            </li>
            <li>
              <a routerLink="/expenses" routerLinkActive="active" [title]="isSidebarCollapsed() ? 'Expenses' : ''">
                <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span *ngIf="!isSidebarCollapsed()">Expenses</span>
              </a>
            </li>
            <li>
              <a routerLink="/credits" routerLinkActive="active" [title]="isSidebarCollapsed() ? 'Credits' : ''">
                <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                  <circle cx="12" cy="12" r="2"></circle>
                  <path d="M6 12h.01M18 12h.01"></path>
                </svg>
                <span *ngIf="!isSidebarCollapsed()">Credits</span>
              </a>
            </li>
            <li>
              <a routerLink="/investments" routerLinkActive="active" [title]="isSidebarCollapsed() ? 'Investments' : ''">
                <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                <span *ngIf="!isSidebarCollapsed()">Investments</span>
              </a>
            </li>
          </ul>

          <div class="nav-section-label" style="margin-top: 20px;" *ngIf="!isSidebarCollapsed()">Management</div>
          <ul>
            <li>
              <a routerLink="/portfolio" routerLinkActive="active" [title]="isSidebarCollapsed() ? 'Portfolios' : ''">
                <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span *ngIf="!isSidebarCollapsed()">Portfolios</span>
              </a>
            </li>
            <li>
              <a routerLink="/settings" routerLinkActive="active" [title]="isSidebarCollapsed() ? 'Settings' : ''">
                <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span *ngIf="!isSidebarCollapsed()">Settings</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="main-content" [class.full-width]="!authService.isAuthenticated()">
        <!-- Navbar / Header -->
        <header class="navbar" *ngIf="authService.isAuthenticated()">
          <span class="brand">Forward-Looking Finance Portfolio</span>
          
          <div class="portfolio-controls">
            <button class="cmd-k-trigger" (click)="palette.isOpen.set(true)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span>Search</span>
              <kbd>Ctrl K</kbd>
            </button>
            
            <button class="btn-create" (click)="showModal = true">+ New Portfolio</button>
          </div>
        </header>

        <div class="content-wrapper" [class.no-padding]="!authService.isAuthenticated()">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
    
    <!-- Keyboard Shortcuts Reference Modal -->
    <div class="shortcuts-modal-backdrop" *ngIf="shortcutsService.showHelpModal()" (click)="shortcutsService.showHelpModal.set(false)">
      <div class="shortcuts-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>⌨️ Keyboard Shortcuts Reference</h3>
          <button class="close-btn" (click)="shortcutsService.showHelpModal.set(false)">×</button>
        </div>
        <div class="modal-body">
          <table class="shortcuts-table">
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of shortcutsService.shortcutsList">
                <td><kbd>{{ item.keyCombo }}</kbd></td>
                <td>{{ item.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <app-command-palette #palette></app-command-palette>
    <app-portfolio-modal *ngIf="showModal" (closed)="showModal = false"></app-portfolio-modal>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  accountState = inject(AccountStateService);
  settings = inject(SettingsService);
  authService = inject(AuthService);
  shortcutsService = inject(KeyboardShortcutsService);
  
  showModal = false;
  isSidebarCollapsed = signal<boolean>(false);

  ngOnInit() {
    this.shortcutsService.initKeyboardListeners();
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}



