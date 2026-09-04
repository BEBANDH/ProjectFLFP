import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, Theme, Accent } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { KeyboardShortcutsService } from '../../../core/services/keyboard-shortcuts.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container">
      <header class="page-header">
        <h1>Application Settings</h1>
        <p class="subtitle">Customize your FLFP experience.</p>
      </header>

      <div class="card settings-card">
        <h3>Account</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <strong>Logged In As</strong>
            <span>{{ authService.currentUserEmail() || 'Unknown' }}</span>
          </div>
          <div class="setting-action">
            <button class="toggle-btn logout-btn" (click)="authService.logout()">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div class="card settings-card">
        <h3>Preferences</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <strong>Appearance</strong>
            <span>Toggle between Dark and Light mode.</span>
          </div>
          <div class="setting-action">
            <button class="toggle-btn" (click)="settings.toggleTheme()">
              <span *ngIf="settings.theme() === 'dark'" class="btn-with-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <span>Switch to Light Mode</span>
              </span>
              <span *ngIf="settings.theme() === 'light'" class="btn-with-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                <span>Switch to Dark Mode</span>
              </span>
            </button>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <strong>Accent Color</strong>
            <span>Personalize your experience with a custom accent color.</span>
          </div>
          <div class="setting-action swatches-container">
            <button 
              *ngFor="let acc of accentOptions" 
              class="swatch" 
              [class.active]="settings.accentColor() === acc.id"
              [style.backgroundColor]="acc.color"
              (click)="settings.setAccent(acc.id)"
              [title]="acc.name">
              <span *ngIf="settings.accentColor() === acc.id" class="check-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
            </button>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <strong>Base Currency</strong>
            <span>Select the default currency for all projections and transactions.</span>
          </div>
          <div class="setting-action">
            <select [ngModel]="settings.currencyCode()" (ngModelChange)="settings.setCurrency($event)">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Keyboard Shortcuts Cheat Sheet -->
      <div class="card settings-card">
        <h3>Keyboard Shortcuts Reference</h3>
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

      <!-- Release Notes & Changelog (v1.0) -->
      <div class="card settings-card">
        <div class="changelog-header-row">
          <h3>Release Notes & Changelog</h3>
          <span class="v1-badge">v1.0 Flagship Release</span>
        </div>

        <div class="changelog-body">
          <div class="version-block">
            <div class="version-title">
              <span class="version-num">v1.0.0</span>
              <span class="version-date">September 2026</span>
            </div>
            <ul class="version-features">
              <li>🚀 <strong>FIRE & Freedom Engine</strong>: Calculates 4% SWR Target Nest Egg and predicts crossover date.</li>
              <li>🍩 <strong>Asset Allocation Donut Chart</strong>: Grouping investments by SIP, Mutual Funds, Stocks, and Fixed Deposits.</li>
              <li>🔍 <strong>Global Command Palette (Ctrl + K)</strong>: Instant keyboard-driven navigation search.</li>
              <li>📊 <strong>Excel / CSV Exporter</strong>: 1-click financial data exports for offline auditing.</li>
              <li>🚀 <strong>Guided Portfolio Wizard</strong>: 4-step interactive setup for new account baseline creation.</li>
              <li>🖨️ <strong>Clean Printable Invoice & Statement Engine</strong>: Printable financial PDF reports omitting navigation UI.</li>
              <li>🎯 <strong>Goal Planner & Time-To-Reach Metrics</strong>: Dynamic calculation of exact months needed to hit milestone targets.</li>
              <li>⚡ <strong>Sidebar Collapse & Compact Mode</strong>: Icon-only sidebar view for maximum screen real estate.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container { display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 0 auto; width: 100%; }
    .page-header h1 { margin: 0; color: var(--primary-color); }
    .subtitle { color: var(--text-muted); margin-top: 5px; }
    
    .settings-card h3 { margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; }
    
    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
    .setting-row:last-child { border-bottom: none; padding-bottom: 0; }
    
    .setting-info { display: flex; flex-direction: column; gap: 4px; }
    .setting-info strong { font-size: 1rem; }
    .setting-info span { color: var(--text-muted); font-size: 0.85rem; }
    
    .setting-action select, .setting-action button.toggle-btn { min-width: 150px; }
    
    .btn-with-icon {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }

    .swatches-container { display: flex; gap: 10px; }

    .swatch {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      padding: 0;
      min-width: unset;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .swatch:hover { transform: scale(1.1); }
    .swatch.active {
      transform: scale(1.15);
      border-color: var(--text-color);
      box-shadow: 0 0 0 2px var(--bg-color), 0 0 0 4px var(--text-color);
    }

    .check-icon { color: white; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

    .logout-btn {
      background-color: transparent !important;
      color: var(--negative-color) !important;
      border: 1px solid var(--negative-color) !important;
      box-shadow: none !important;
    }
    
    .logout-btn:hover {
      background-color: rgba(239, 68, 68, 0.1) !important;
      transform: none !important;
    }

    .changelog-header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 16px; }
    .changelog-header-row h3 { margin: 0; border: none; padding: 0; }
    .v1-badge { background: var(--primary-color); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 12px; }

    .version-title { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .version-num { font-size: 1.1rem; font-weight: 800; color: var(--primary-color); }
    .version-date { font-size: 0.8rem; color: var(--text-muted); }
    
    .version-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem; }
    .version-features li { line-height: 1.5; color: var(--text-color); }
  `]
})
export class SettingsPageComponent {
  settings = inject(SettingsService);
  authService = inject(AuthService);
  shortcutsService = inject(KeyboardShortcutsService);

  accentOptions: { id: Accent, name: string, color: string }[] = [
    { id: 'indigo', name: 'Indigo', color: '#6366f1' },
    { id: 'emerald', name: 'Emerald', color: '#10b981' },
    { id: 'rose', name: 'Rose', color: '#f43f5e' },
    { id: 'amber', name: 'Amber', color: '#f59e0b' },
    { id: 'violet', name: 'Violet', color: '#8b5cf6' }
  ];
}

