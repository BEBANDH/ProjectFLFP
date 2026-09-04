import { Component, ChangeDetectionStrategy, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-asset-allocation-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="allocation-card">
      <div class="chart-header">
        <h4>Asset Portfolio Allocation</h4>
        <span class="sub-text">Distribution across investment styles</span>
      </div>
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .allocation-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: var(--shadow-sm);
    }
    .chart-header h4 { margin: 0; font-size: 0.95rem; color: var(--text-color); }
    .sub-text { font-size: 0.72rem; color: var(--text-muted); }
    .chart-container {
      position: relative;
      height: 195px;
      width: 100%;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class AssetAllocationChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() investments: any[] = [];

  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investments']) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  private updateChart() {
    if (!this.chartCanvas) return;

    setTimeout(() => {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      // Group investments by style (SIP, MUTUAL_FUND, FIXED_DEPOSIT, STOCKS, REAL_ESTATE, CRYPTO)
      const categories: { [key: string]: number } = {};
      this.investments.forEach(inv => {
        const style = inv.investmentStyle || 'GENERAL';
        categories[style] = (categories[style] || 0) + Number(inv.investedAmount);
      });

      const labels = Object.keys(categories);
      const data = Object.values(categories);

      if (labels.length === 0) {
        labels.push('Cash Baseline');
        data.push(100);
      }

      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: 'var(--surface-color)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#94a3b8',
                font: { size: 11, family: 'Inter' }
              }
            }
          },
          cutout: '70%'
        }
      });
    }, 0);
  }
}
