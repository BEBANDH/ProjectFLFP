import { Component, ChangeDetectionStrategy, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-projection-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 220px;
      width: 100%;
      margin-top: 6px;
    }
    
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class ProjectionChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  
  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['labels']) {
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

      // Subtle gradient for wealth trajectory area
      const gradient = ctx.createLinearGradient(0, 0, 0, 220);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      const datasets: any[] = [{
        label: 'Projected Wealth',
        data: this.data,
        borderColor: '#6366f1',
        backgroundColor: gradient,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#0b0c0e',
        pointBorderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 6
      }];

      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(20, 22, 26, 0.95)',
              titleColor: '#f3f4f6',
              bodyColor: '#10b981',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 1,
              padding: 10,
              boxPadding: 4,
              usePointStyle: true,
              callbacks: {
                label: function(context) {
                  const val = context.parsed.y ?? 0;
                  return ' ' + (val >= 0 ? '$' : '-$') + Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.04)' },
              ticks: { 
                color: '#8b92a0',
                font: { size: 11, family: 'Inter' }
              }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.04)' },
              ticks: { 
                color: '#8b92a0',
                font: { size: 11, family: 'Inter' },
                callback: function(value) {
                  const num = Number(value);
                  if (Math.abs(num) >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
                  if (Math.abs(num) >= 1e3) return '$' + (num / 1e3).toFixed(0) + 'k';
                  return '$' + num;
                }
              }
            }
          }
        }
      });
    }, 0);
  }
}
