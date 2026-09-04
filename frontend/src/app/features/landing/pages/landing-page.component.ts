import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-container">
      <!-- Public Hero Navigation Bar -->
      <nav class="landing-nav">
        <div class="nav-brand">
          <div class="logo-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <span class="brand-text">FLFP</span>
        </div>
        
        <div class="nav-actions">
          <a routerLink="/login" class="btn-ghost">Sign In</a>
          <a routerLink="/login" [queryParams]="{mode: 'signup'}" class="btn-primary-gradient">Get Started Free</a>
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="hero-section">
        <div class="hero-badge">🚀 Financial Independence & Real-Time Projections</div>
        <h1 class="hero-title">Take Control of Your Wealth & Forecast Your Freedom Date</h1>
        <p class="hero-subtitle">
          FLFP compounds your investments, recurring income, and expenses to calculate your exact 
          <strong>FIRE Crossover Point</strong> (25x Annual Expenses) and 30-Year Wealth Trajectory.
        </p>

        <div class="hero-cta-group">
          <button (click)="getStarted()" class="btn-hero-main">Launch Your Portfolio Now →</button>
          <a href="#features" class="btn-hero-secondary">Explore Platform Features</a>
        </div>

        <!-- Live Demo Interactive Preview Banner -->
        <div class="interactive-preview-card">
          <div class="preview-header">
            <div class="dot-indicators">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <span class="preview-title">FLFP Real-Time FIRE Intelligence Dashboard</span>
          </div>
          <div class="preview-stats-grid">
            <div class="preview-stat">
              <span class="stat-lbl">FIRE Target (4% Rule)</span>
              <span class="stat-val">$1,200,000</span>
            </div>
            <div class="preview-stat highlight">
              <span class="stat-lbl">Savings Rate Multiplier</span>
              <span class="stat-val">42.8%</span>
            </div>
            <div class="preview-stat positive">
              <span class="stat-lbl">Projected Crossover Date</span>
              <span class="stat-val">Nov 2032 (9.2 Yrs)</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="section-header">
          <h2>Built for Serious Wealth Building</h2>
          <p>Everything you need to plan retirement, track SIPs, and visualize compounding curves.</p>
        </div>

        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="feature-icon indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
            <h3>FIRE & Crossover Engine</h3>
            <p>Calculates the exact date when passive compounding returns outpace your recurring monthly expenses.</p>
          </div>

          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="feature-icon emerald">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>
            </div>
            <h3>Bento Grid Financial Hub</h3>
            <p>Sleek dashboard layout displaying your baseline cash, recurring salary, expenses, and asset allocations.</p>
          </div>

          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="feature-icon amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3>Target Date Simulator</h3>
            <p>Simulate future bank balances for any date in the future with custom compounding returns.</p>
          </div>

          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="feature-icon violet">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            </div>
            <h3>Financial Goals Planner</h3>
            <p>Set custom milestone targets (e.g. House Down Payment) and track whether your portfolio is on pace.</p>
          </div>
        </div>
      </section>

      <!-- CTA Footer -->
      <footer class="landing-footer">
        <div class="footer-content">
          <h3>Ready to chart your path to financial freedom?</h3>
          <button (click)="getStarted()" class="btn-hero-main">Create Free Account</button>
          <div class="footer-links">
            <span>© 2026 FLFP • Forward-Looking Finance Portfolio</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-container {
      background-color: var(--bg-color);
      color: var(--text-color);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', sans-serif;
    }
    
    .landing-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 40px;
      border-bottom: 1px solid var(--border-color);
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .nav-brand { display: flex; align-items: center; gap: 10px; }
    .logo-box {
      background: var(--primary-color);
      color: #fff;
      padding: 6px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-text { font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 800; }

    .nav-actions { display: flex; align-items: center; gap: 16px; }
    .btn-ghost { color: var(--text-color); text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .btn-primary-gradient {
      background: linear-gradient(135deg, var(--primary-color) 0%, #818cf8 100%);
      color: #fff;
      padding: 8px 18px;
      border-radius: 20px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .hero-section {
      max-width: 900px;
      margin: 60px auto 40px auto;
      text-align: center;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .hero-badge {
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary-color);
      border: 1px solid var(--primary-glow);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .hero-title {
      font-size: 2.8rem;
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0;
      background: linear-gradient(180deg, var(--text-color) 0%, var(--text-muted) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 720px;
      margin: 0;
    }

    .hero-cta-group { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; justify-content: center; }
    .btn-hero-main {
      background: var(--primary-color);
      color: #fff;
      border: none;
      padding: 14px 32px;
      border-radius: 30px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 24px var(--primary-glow);
      transition: transform 0.2s ease;
    }
    .btn-hero-main:hover { transform: translateY(-2px); }

    .btn-hero-secondary {
      color: var(--text-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 12px 20px;
    }

    .interactive-preview-card {
      width: 100%;
      max-width: 800px;
      margin-top: 30px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    .preview-header {
      background: var(--surface-hover);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .dot-indicators { display: flex; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }

    .preview-title { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }

    .preview-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      padding: 20px;
      gap: 16px;
      text-align: left;
    }

    .preview-stat { display: flex; flex-direction: column; gap: 4px; }
    .stat-lbl { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    .stat-val { font-size: 1.4rem; font-weight: 800; font-family: 'Outfit', sans-serif; }
    .preview-stat.highlight .stat-val { color: var(--primary-color); }
    .preview-stat.positive .stat-val { color: var(--positive-color); }

    .features-section {
      max-width: 1100px;
      margin: 80px auto;
      padding: 0 20px;
    }

    .section-header { text-align: center; margin-bottom: 40px; }
    .section-header h2 { font-size: 2rem; margin: 0 0 10px 0; }
    .section-header p { color: var(--text-muted); margin: 0; }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
    }

    .feature-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feature-icon.indigo { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .feature-icon.emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .feature-icon.amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .feature-icon.violet { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }

    .feature-card h3 { margin: 0; font-size: 1.1rem; }
    .feature-card p { margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }

    .landing-footer {
      border-top: 1px solid var(--border-color);
      padding: 60px 20px;
      text-align: center;
      margin-top: auto;
      background: var(--surface-color);
    }

    .footer-content { display: flex; flex-direction: column; align-items: center; gap: 20px; }
    .footer-links { font-size: 0.85rem; color: var(--text-muted); margin-top: 10px; }
  `]
})
export class LandingPageComponent {
  authService = inject(AuthService);
  router = inject(Router);

  getStarted() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
