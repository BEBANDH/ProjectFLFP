import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FireSummaryResponse } from '../../../../shared/models/common-api.models';
import { SettingsService } from '../../../../core/services/settings.service';

@Component({
  selector: 'app-fire-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="fire-gauge-card" *ngIf="fireSummary">
      <div class="gauge-header">
        <div class="header-left">
          <div class="fire-icon-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
          </div>
          <div>
            <h4>FIRE Freedom Gauge</h4>
            <span class="sub-text">4% Safe Withdrawal Target (25x Outflows)</span>
          </div>
        </div>

        <div class="fire-status-pill" [class.achieved]="fireSummary.isFireAchieved">
          {{ fireSummary.isFireAchieved ? '🎉 Freedom Achieved' : '📈 Accumulation Phase' }}
        </div>
      </div>

      <!-- Main Visual Progress Bar / Multi-Segment Track -->
      <div class="gauge-meter-section">
        <div class="meter-top-row">
          <span class="pct-highlight">{{ fireSummary.fireProgressPercent | number:'1.0-1' }}%</span>
          <span class="crossover-tag" *ngIf="fireSummary.fireCrossoverDate">
            Target Horizon: <strong>{{ fireSummary.fireCrossoverDate | date:'MMM yyyy' }}</strong>
          </span>
          <span class="crossover-tag warning" *ngIf="!fireSummary.fireCrossoverDate">
            Target Horizon: <strong>Needs Higher Savings</strong>
          </span>
        </div>

        <div class="meter-track">
          <div class="meter-fill" [style.width.%]="normalizedPercent"></div>
          <!-- Milestone Markers -->
          <div class="marker m-25" title="Lean FIRE (25%)"></div>
          <div class="marker m-50" title="Halfway (50%)"></div>
          <div class="marker m-75" title="Coast FIRE (75%)"></div>
        </div>
        <div class="meter-labels">
          <span>0%</span>
          <span>25% Lean</span>
          <span>50% Half</span>
          <span>75% Coast</span>
          <span>100% FIRE</span>
        </div>
      </div>

      <!-- Compact 3-Column Metrics Strip -->
      <div class="fire-stats-strip">
        <div class="stat-col">
          <span class="col-lbl">Current Nest Egg</span>
          <span class="col-val accent">{{ fireSummary.currentPortfolioNestEgg | currency:settings.currencyCode() }}</span>
        </div>
        <div class="stat-col">
          <span class="col-lbl">Target Nest Egg</span>
          <span class="col-val">{{ fireSummary.fireTargetNumber | currency:settings.currencyCode() }}</span>
        </div>
        <div class="stat-col">
          <span class="col-lbl">Savings Rate</span>
          <span class="col-val positive">{{ fireSummary.savingsRatePercent | number:'1.0-1' }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fire-gauge-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow-sm);
    }

    .gauge-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .fire-icon-badge {
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      padding: 6px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gauge-header h4 { margin: 0; font-size: 0.95rem; color: var(--text-color); }
    .sub-text { font-size: 0.72rem; color: var(--text-muted); }

    .fire-status-pill {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
      background: rgba(99, 102, 241, 0.12);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .fire-status-pill.achieved {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.3);
    }

    .gauge-meter-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meter-top-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .pct-highlight {
      font-size: 1.25rem;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }

    .crossover-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .crossover-tag strong {
      color: var(--positive-color);
    }
    .crossover-tag.warning strong {
      color: var(--warning-color);
    }

    .meter-track {
      height: 8px;
      background: var(--surface-hover);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .meter-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color) 0%, #10b981 100%);
      border-radius: 4px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .marker {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: rgba(0, 0, 0, 0.4);
    }
    .m-25 { left: 25%; }
    .m-50 { left: 50%; }
    .m-75 { left: 75%; }

    .meter-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .fire-stats-strip {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 8px 10px;
    }

    .stat-col {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .col-lbl {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .col-val {
      font-size: 0.85rem;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
      color: var(--text-color);
    }
    .col-val.accent { color: #818cf8; }
    .col-val.positive { color: var(--positive-color); }
  `]
})
export class FireGaugeComponent {
  settings = inject(SettingsService);
  @Input() fireSummary: FireSummaryResponse | null = null;

  get normalizedPercent(): number {
    if (!this.fireSummary || !this.fireSummary.fireProgressPercent) return 0;
    return Math.min(100, Math.max(0, this.fireSummary.fireProgressPercent));
  }
}
