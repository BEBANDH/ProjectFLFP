import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { AccountStateService } from '../../../core/services/account-state.service';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Preferences';
  icon: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="palette-overlay" *ngIf="isOpen()" (click)="close()">
      <div class="palette-modal" (click)="$event.stopPropagation()">
        <div class="palette-search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Type a command or search (e.g. 'Dashboard', 'Theme', 'Export')..." 
            #searchInput
            (keydown.escape)="close()"
            (keydown.arrowdown)="moveSelection(1)"
            (keydown.arrowup)="moveSelection(-1)"
            (keydown.enter)="executeSelected()"
            autofocus
          >
          <span class="esc-badge">ESC</span>
        </div>

        <div class="palette-results">
          <div *ngIf="filteredCommands().length === 0" class="no-results">
            No matching commands found.
          </div>
          
          <div 
            *ngFor="let item of filteredCommands(); let i = index" 
            class="command-item" 
            [class.selected]="selectedIndex === i"
            (mouseenter)="selectedIndex = i"
            (click)="runItem(item)"
          >
            <div class="command-icon" [innerHTML]="item.icon"></div>
            <div class="command-title">{{ item.title }}</div>
            <span class="command-category">{{ item.category }}</span>
          </div>
        </div>

        <div class="palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .palette-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 100px;
    }

    .palette-modal {
      width: 100%;
      max-width: 620px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .palette-search-bar {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      gap: 12px;
      color: var(--text-muted);
    }

    .palette-search-bar input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text-color);
      font-size: 1.1rem;
      font-family: inherit;
    }

    .esc-badge {
      font-size: 0.7rem;
      font-weight: 700;
      background: var(--surface-hover);
      color: var(--text-muted);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
    }

    .palette-results {
      max-height: 360px;
      overflow-y: auto;
      padding: 10px 0;
    }

    .no-results {
      padding: 24px;
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
    }

    .command-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      gap: 14px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .command-item.selected {
      background: var(--primary-glow);
    }

    .command-icon {
      display: flex;
      align-items: center;
      color: var(--primary-color);
    }

    .command-title {
      flex: 1;
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-color);
    }

    .command-category {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .palette-footer {
      display: flex;
      gap: 20px;
      padding: 12px 20px;
      background: var(--bg-color);
      border-top: 1px solid var(--border-color);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    kbd {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 700;
    }
  `]
})
export class CommandPaletteComponent {
  isOpen = signal<boolean>(false);
  searchQuery = '';
  selectedIndex = 0;

  router = inject(Router);
  settings = inject(SettingsService);
  accountState = inject(AccountStateService);

  commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Wealth Projection Dashboard',
      category: 'Navigation',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
      action: () => this.router.navigate(['/dashboard'])
    },
    {
      id: 'nav-investments',
      title: 'Go to Investment Portfolio Manager',
      category: 'Navigation',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
      action: () => this.router.navigate(['/investments'])
    },
    {
      id: 'nav-expenses',
      title: 'Go to Expense & Outflows Manager',
      category: 'Navigation',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
      action: () => this.router.navigate(['/expenses'])
    },
    {
      id: 'nav-credits',
      title: 'Go to Income & Credits Manager',
      category: 'Navigation',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
      action: () => this.router.navigate(['/credits'])
    },
    {
      id: 'nav-settings',
      title: 'Go to Preferences & Settings',
      category: 'Navigation',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
      action: () => this.router.navigate(['/settings'])
    },
    {
      id: 'action-theme',
      title: 'Toggle Light / Dark Theme Mode',
      category: 'Preferences',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
      action: () => this.settings.toggleTheme()
    },
    {
      id: 'action-export-pdf',
      title: 'Export / Print Wealth Summary Report (PDF)',
      category: 'Actions',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>`,
      action: () => window.print()
    }
  ];

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.isOpen.set(!this.isOpen());
      this.searchQuery = '';
      this.selectedIndex = 0;
    }
  }

  close() {
    this.isOpen.set(false);
  }

  filteredCommands(): CommandItem[] {
    if (!this.searchQuery.trim()) return this.commands;
    const query = this.searchQuery.toLowerCase();
    return this.commands.filter(c => 
      c.title.toLowerCase().includes(query) || c.category.toLowerCase().includes(query)
    );
  }

  moveSelection(direction: number) {
    const total = this.filteredCommands().length;
    if (total === 0) return;
    this.selectedIndex = (this.selectedIndex + direction + total) % total;
  }

  executeSelected() {
    const list = this.filteredCommands();
    if (list[this.selectedIndex]) {
      this.runItem(list[this.selectedIndex]);
    }
  }

  runItem(item: CommandItem) {
    item.action();
    this.close();
  }
}
