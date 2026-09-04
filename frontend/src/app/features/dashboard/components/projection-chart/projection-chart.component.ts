import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-projection-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 250px;
      width: 100%;
      margin-top: 10px;
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
  @Input() fireTargetNumber: number | null = null;
  
  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['labels'] || changes['fireTargetNumber']) {
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
    
    // Allow view to render first if newly created
    setTimeout(() => {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const datasets: any[] = [{
        label: 'Projected Wealth ($)',
        data: this.data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
        pointHoverRadius: 7
      }];

      if (this.fireTargetNumber && this.fireTargetNumber > 0) {
        const fireLineData = new Array(this.labels.length).fill(this.fireTargetNumber);
        datasets.push({
          label: 'FIRE Target Threshold (4% Rule)',
          data: fireLineData,
          borderColor: '#f59e0b',
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false
        });
      }

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
              labels: {
                color: '#94a3b8',
                font: { family: 'Inter', size: 12 }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#f8fafc',
              bodyColor: '#94a3b8',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 12,
              displayColors: true
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8' }
            }
          }
        }
      });
    }, 0);
  }
}
