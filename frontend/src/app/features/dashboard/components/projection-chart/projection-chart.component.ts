import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, OnDestroy } from '@angular/core';
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
      height: 300px;
      width: 100%;
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class ProjectionChartComponent implements OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  
  private chartInstance: Chart | null = null;

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
    
    // Allow view to render first if newly created
    setTimeout(() => {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.labels,
          datasets: [{
            label: 'Projected Wealth ($)',
            data: this.data,
            borderColor: '#00E676', // Mint green from SRS
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#5C6BC0',
            pointRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#e0e0e0' // Text color
              }
            }
          },
          scales: {
            x: {
              grid: { color: '#333333' },
              ticks: { color: '#9e9e9e' }
            },
            y: {
              grid: { color: '#333333' },
              ticks: { color: '#9e9e9e' }
            }
          }
        }
      });
    }, 0);
  }
}
