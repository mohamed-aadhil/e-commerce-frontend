import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, TooltipItem, Plugin } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AnalyticsService, GenreDistribution } from '../../../services/analytics.service';
import { WebSocketService } from '../../../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-genre-distribution-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseChartDirective,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  providers: [
    // Register the datalabels plugin
    { provide: 'chartPlugins', useValue: [ChartDataLabels] }
  ],
  template: `
    <mat-card class="h-full flex flex-col">
      <mat-card-header>
        <mat-card-title>Genre Distribution</mat-card-title>
        <mat-card-subtitle>Books by Genre</mat-card-subtitle>
        <div class="flex-1"></div>
        <div class="flex items-center">
          <div class="flex items-center mr-3">
            <span class="inline-block w-3 h-3 rounded-full mr-1" [ngClass]="isConnected ? 'bg-green-500' : 'bg-red-500'"></span>
            <span class="text-sm">{{ isConnected ? 'Live' : 'Offline' }}</span>
          </div>
          <button 
            mat-icon-button 
            [disabled]="isLoading"
            (click)="loadData()"
            matTooltip="Refresh data">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content class="flex-1">
        <div *ngIf="isLoading && !chartData" class="flex justify-center p-5">
          <mat-spinner></mat-spinner>
        </div>

        <div *ngIf="errorMessage" class="p-3 bg-red-100 text-red-800 rounded">
          {{ errorMessage }}
        </div>

        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">Genre Distribution</h3>
          <mat-form-field appearance="outline" class="w-40">
            <mat-label>Chart Type</mat-label>
            <mat-select [(ngModel)]="selectedChartType" (selectionChange)="onChartTypeChange()">
              <mat-option *ngFor="let option of chartTypeOptions" [value]="option.value">
                {{ option.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="chart-container" [style.height]="chartHeight">
          <canvas 
            baseChart
            [data]="chartData"
            [options]="chartOptions"
            [type]="chartType">
          </canvas>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .h-full {
      height: 100%;
    }
    .flex {
      display: flex;
    }
    .flex-1 {
      flex: 1;
    }
    .items-center {
      align-items: center;
    }
    .justify-center {
      justify-content: center;
    }
    .justify-between {
      justify-content: space-between;
    }
    .mr-3 {
      margin-right: 0.75rem;
    }
    .mt-4 {
      margin-top: 1rem;
    }
    .p-3 {
      padding: 0.75rem;
    }
    .p-5 {
      padding: 1.25rem;
    }
    .bg-red-100 {
      background-color: #fee2e2;
    }
    .text-red-800 {
      color: #991b1b;
    }
    .bg-green-500 {
      background-color: #22c55e;
    }
    .bg-red-500 {
      background-color: #ef4444;
    }
    .rounded {
      border-radius: 0.25rem;
    }
    .rounded-full {
      border-radius: 9999px;
    }
    .inline-block {
      display: inline-block;
    }
    .w-3 {
      width: 0.75rem;
    }
    .h-3 {
      height: 0.75rem;
    }
    .text-sm {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    .chart-container {
      position: relative;
      width: 100%;
      min-height: 300px;
    }
    
    @media (max-width: 992px) {
      .chart-container {
        min-height: 250px;
      }
    }
  `]
})
export class GenreDistributionChartComponent implements OnInit, OnDestroy {
  chartData: ChartData = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1
    }]
  };
  chartType: ChartType = 'doughnut';
  selectedChartType: ChartType = 'doughnut';
  chartHeight = '400px';
  
  chartTypeOptions = [
    { label: 'Doughnut', value: 'doughnut' },
    { label: 'Pie', value: 'pie' },
    { label: 'Bar', value: 'bar' }
  ];

  // Chart options with proper typing for datalabels and doughnut options
  chartOptions: ChartConfiguration['options'] & {
    elements?: {
      arc?: {
        borderWidth?: number;
        borderColor?: string;
        borderRadius?: number;
      };
    };
    cutout?: string | number;
    plugins: {
      datalabels: {
        display: (context: any) => boolean;
        formatter: (value: number, context: any) => string;
        color: string;
        font: {
          weight: string;
          size: number;
        };
        textAlign: string;
        textStrokeColor: string;
        textStrokeWidth: number;
        textShadowColor: string;
        textShadowBlur: number;
      };
    };
  } = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<ChartType>) => {
            const label = context.label || '';
            const value = context.raw as number;
            const dataset = context.dataset.data as number[];
            const total = dataset.reduce((a, b) => (a || 0) + (b || 0), 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      // Configure datalabels plugin
      datalabels: {
        display: (context: any) => {
          // Only show labels for slices that are large enough
          const dataset = context.dataset;
          const value = dataset.data[context.dataIndex];
          const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = (value / total) * 100;
          return percentage > 5; // Only show labels for slices > 5%
        },
        formatter: (value: number, context: any) => {
          const dataset = context.chart.data.datasets[0].data as number[];
          const total = dataset.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${percentage}%`;
        },
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12
        },
        textAlign: 'center',
        textStrokeColor: 'rgba(0, 0, 0, 0.5)',
        textStrokeWidth: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowBlur: 3
      }
    },
    // Animation settings - using only supported properties
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    },
    // Doughnut specific options
    cutout: '60%'
  };

  private generateColors(count: number): string[] {
    const colors: string[] = [];
    const hueStep = 360 / Math.max(1, count);
    
    for (let i = 0; i < count; i++) {
      const hue = Math.floor(i * hueStep) % 360;
      const saturation = 70 + Math.random() * 20; // 70-90%
      const lightness = 50 + Math.random() * 10; // 50-60%
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    
    return colors;
  }
  
  private adjustColor(color: string, amount: number): string {
    // Simple color adjustment for borders
    if (color.startsWith('hsl')) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        const h = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        let l = parseInt(match[3], 10) + amount;
        l = Math.max(0, Math.min(100, l)); // Clamp between 0-100
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
    }
    return color;
  }

  private prepareChartData(data: GenreDistribution[]): ChartData {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        labels: ['No data available'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderColor: ['#bdbdbd'],
          borderWidth: 1
        }]
      };
    }

    // Sort by book count in descending order
    const sortedData = [...data].sort((a, b) => b.bookCount - a.bookCount);
    
    // Take top 10 genres and group the rest as 'Others'
    const topGenres = sortedData.slice(0, 9);
    const otherGenres = sortedData.slice(9);
    
    const labels = [...topGenres.map(g => g.name)];
    const values = [...topGenres.map(g => g.bookCount)];
    
    if (otherGenres.length > 0) {
      const otherCount = otherGenres.reduce((sum, genre) => sum + genre.bookCount, 0);
      labels.push('Others');
      values.push(otherCount);
    }

    // Generate colors
    const backgroundColors = this.generateColors(labels.length);
    
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => this.adjustColor(color, -20)),
        borderWidth: 1,
        hoverOffset: 10
      }]
    };
  }

  isLoading = false;
  errorMessage: string | null = null;
  isConnected = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private analyticsService: AnalyticsService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar
  ) {
    // Initialize with empty data
    this.chartData = this.prepareChartData([]);
  }

  ngOnInit(): void {
    this.loadData();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.analyticsService.getGenreDistribution().subscribe({
      next: (data: GenreDistribution[]) => {
        this.chartData = this.prepareChartData(data);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading genre distribution:', error);
        this.errorMessage = 'Failed to load genre distribution data. Please try again later.';
        this.isLoading = false;
        this.snackBar.open('Failed to load genre distribution data.', 'Dismiss', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onChartTypeChange(): void {
    this.chartType = this.selectedChartType;
    // Adjust chart height based on type
    if (this.chartType === 'bar') {
      this.chartHeight = '500px';
    } else {
      this.chartHeight = '400px';
    }
  }

  ngAfterViewInit(): void {
    // Initial chart height setup
    this.onChartTypeChange();
  }

  private setupWebSocket(): void {
    // Listen for connection status
    this.webSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isConnected: boolean) => {
        this.isConnected = isConnected;
      });

    // Listen for data updates
    this.webSocketService.genreUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: any) => {
        if (update?.genreDistribution) {
          this.chartData = this.prepareChartData(update.genreDistribution);
          this.snackBar.open('Genre distribution updated', 'Dismiss', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      });
  }
}
