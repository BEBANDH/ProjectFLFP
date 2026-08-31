import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';
export type Accent = 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  
  public theme = signal<Theme>('dark');
  public currencyCode = signal<string>('USD');
  public accentColor = signal<Accent>('indigo');

  constructor() {
    this.loadSettings();
    
    // Automatically save and apply settings when they change
    effect(() => {
      const currentTheme = this.theme();
      const currentCurrency = this.currencyCode();
      const currentAccent = this.accentColor();
      
      localStorage.setItem('flfp_theme', currentTheme);
      localStorage.setItem('flfp_currency', currentCurrency);
      localStorage.setItem('flfp_accent', currentAccent);
      
      this.applyTheme(currentTheme, currentAccent);
    });
  }

  private loadSettings() {
    const savedTheme = localStorage.getItem('flfp_theme') as Theme;
    const savedCurrency = localStorage.getItem('flfp_currency');
    const savedAccent = localStorage.getItem('flfp_accent') as Accent;
    
    if (savedTheme) {
      this.theme.set(savedTheme);
    }
    if (savedCurrency) {
      this.currencyCode.set(savedCurrency);
    }
    if (savedAccent) {
      this.accentColor.set(savedAccent);
    }
  }

  private applyTheme(theme: Theme, accent: Accent) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    
    // Remove all previous accent classes
    document.body.classList.remove('accent-indigo', 'accent-emerald', 'accent-rose', 'accent-amber', 'accent-violet');
    // Add current accent class
    document.body.classList.add(`accent-${accent}`);
  }

  toggleTheme() {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setCurrency(code: string) {
    this.currencyCode.set(code);
  }

  setAccent(accent: Accent) {
    this.accentColor.set(accent);
  }
}
