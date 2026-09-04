import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface ShortcutHelp {
  keyCombo: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  private router = inject(Router);

  public showHelpModal = signal<boolean>(false);
  private keyBuffer: string[] = [];
  private bufferTimeout: any = null;

  public readonly shortcutsList: ShortcutHelp[] = [
    { keyCombo: 'Ctrl + K / Cmd + K', description: 'Open Global Command Palette Search' },
    { keyCombo: 'g d', description: 'Navigate to Dashboard' },
    { keyCombo: 'g e', description: 'Navigate to Expenses' },
    { keyCombo: 'g c', description: 'Navigate to Credits (Income)' },
    { keyCombo: 'g i', description: 'Navigate to Investments' },
    { keyCombo: 'g p', description: 'Navigate to Portfolios' },
    { keyCombo: 'g s', description: 'Navigate to Settings' },
    { keyCombo: '?', description: 'Toggle Keyboard Shortcuts Reference' }
  ];

  initKeyboardListeners() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea/select
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(activeTag)) return;

      if (e.key === '?') {
        e.preventDefault();
        this.showHelpModal.update(val => !val);
        return;
      }

      // Handle sequence keys like 'g' then 'd'
      const key = e.key.toLowerCase();
      this.keyBuffer.push(key);

      clearTimeout(this.bufferTimeout);
      this.bufferTimeout = setTimeout(() => {
        this.keyBuffer = [];
      }, 750);

      const sequence = this.keyBuffer.join(' ');
      if (sequence === 'g d') {
        this.router.navigate(['/dashboard']);
        this.keyBuffer = [];
      } else if (sequence === 'g e') {
        this.router.navigate(['/expenses']);
        this.keyBuffer = [];
      } else if (sequence === 'g c') {
        this.router.navigate(['/credits']);
        this.keyBuffer = [];
      } else if (sequence === 'g i') {
        this.router.navigate(['/investments']);
        this.keyBuffer = [];
      } else if (sequence === 'g p') {
        this.router.navigate(['/portfolio']);
        this.keyBuffer = [];
      } else if (sequence === 'g s') {
        this.router.navigate(['/settings']);
        this.keyBuffer = [];
      }
    });
  }
}
