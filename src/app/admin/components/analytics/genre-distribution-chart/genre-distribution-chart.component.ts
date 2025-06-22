import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, TooltipItem, Plugin } from 'chart.js';
import { AnalyticsService } from '../../../services/analytics.service';
import { WebSocketService } from '../../../services/websocket.service';
import { GenreDistribution, GenreDataUpdate } from '../../../models/analytics.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-genre-distribution-chart',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSelectModule,
    BaseChartDirective
  ],
  providers: [
    DecimalPipe,
    // Register the datalabels plugin
    { provide: 'chartPlugins', useValue: [ChartDataLabels] }
  ],
  template: `
    <div class="flex flex-col h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <!-- Header Section -->
      <div class="px-6 pt-6 pb-2">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <mat-icon class="text-indigo-600">pie_chart</mat-icon>
              Genre Distribution
            </h2>
            <p class="text-gray-600 mt-1">Books distribution across different genres</p>
          </div>
          
          <!-- Chart Type Selector -->
          <div class="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
            <button 
              *ngFor="let option of chartTypeOptions"
              (click)="changeChartType(option.value)"
              [class.bg-indigo-50]="selectedChartType === option.value"
              [class.text-indigo-700]="selectedChartType === option.value"
              [class.font-medium]="selectedChartType === option.value"
              class="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-100 flex items-center"
            >
              <mat-icon class="!w-5 !h-5 mr-1.5">{{ option.icon }}</mat-icon>
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Chart Content -->
      <div class="flex-1 px-6 pb-6 flex flex-col">
        <!-- Loading and Error States -->
        <div *ngIf="isLoading && !chartData" class="flex-1 flex items-center justify-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="errorMessage" class="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start">
          <mat-icon class="text-red-500 mr-2 mt-0.5" style="font-size: 18px">error</mat-icon>
          <div>{{ errorMessage }}</div>
        </div>

        <!-- Chart Container -->
        <div *ngIf="!isLoading && !errorMessage" class="flex-1 flex flex-col">
          <div class="flex-1 min-h-[300px]">
            <canvas baseChart
              [data]="chartData"
              [type]="selectedChartType"
              [options]="chartOptions"
              [plugins]="[]"
              (chartHover)="onChartHover($event)">
            </canvas>
          </div>
          
          <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <!-- Total Products Card -->
            <div class="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-indigo-700 mb-1">Total Products</p>
                  <p class="text-2xl font-bold text-indigo-900">{{ totalBooks | number }}</p>
                </div>
                <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <mat-icon class="text-indigo-600">book</mat-icon>
                </div>
              </div>
              <p class="text-xs text-indigo-600 mt-2">Across all genres</p>
            </div>
            
            <!-- Total Genres Card -->
            <div class="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-purple-700 mb-1">Total Genres</p>
                  <p class="text-2xl font-bold text-purple-900">{{ totalGenres | number }}</p>
                </div>
                <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <mat-icon class="text-purple-600">category</mat-icon>
                </div>
              </div>
              <p class="text-xs text-purple-600 mt-2">With available products</p>
            </div>
            
            <!-- Most Popular Genre Card -->
            <div class="bg-pink-50 rounded-xl p-4 border border-pink-100">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-pink-700 mb-1">Most Popular</p>
                  <p class="text-lg font-bold text-pink-900 truncate" [matTooltip]="mostPopularGenre.name || 'N/A'">
                    {{ mostPopularGenre.name || 'N/A' }}
                  </p>
                  <p class="text-sm text-pink-600">{{ mostPopularGenre.bookCount | number }} books</p>
                </div>
                <div class="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                  <mat-icon class="text-pink-600">star</mat-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  // Stats calculated from genre distribution data
  totalBooks = 0;
  totalGenres = 0;
  mostPopularGenre = {
    id: 0,
    name: '',
    bookCount: 0
  };

  chartData: ChartData = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1
    }]
  };

  // Chart type options with icons
  chartTypeOptions = [
    { label: 'Doughnut', value: 'doughnut' as ChartType, icon: 'donut_large' },
    { label: 'Pie', value: 'pie' as ChartType, icon: 'pie_chart' }
  ];
  
  // Chart type properties
  selectedChartType: ChartType = 'doughnut';
  chartType: ChartType = 'doughnut';
  chartHeight = '350px';

  // Method to handle chart type change safely
  changeChartType(type: ChartType): void {
    if (this.selectedChartType !== type) {
      this.selectedChartType = type;
      this.chartType = type;
      this.onChartTypeChange();
    }
  }

  // Handle chart hover events
  onChartHover(event: any): void {
    // Handle hover events if needed
    // This method is intentionally left empty as we don't need to do anything special on hover
    // The event parameter is kept for future use if needed
  }

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
      // Update stats with empty data
      this.totalBooks = 0;
      this.totalGenres = 0;
      this.mostPopularGenre = {
        id: 0,
        name: '',
        bookCount: 0
      };
      
      return {
        labels: ['No data available'],
        datasets: [{
          label: 'Books',
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderColor: ['#bdbdbd'],
          borderWidth: 1
        }]
      };
    }

    // Sort by book count in descending order
    const sortedData = [...data].sort((a, b) => b.bookCount - a.bookCount);
    
    // Calculate stats
    this.totalBooks = sortedData.reduce((sum, genre) => sum + genre.bookCount, 0);
    this.totalGenres = sortedData.length;
    this.mostPopularGenre = sortedData.length > 0 
      ? { 
          id: sortedData[0].id, 
          name: sortedData[0].name, 
          bookCount: sortedData[0].bookCount 
        } 
      : { id: 0, name: '', bookCount: 0 };
    
    // Take top 10 genres and group the rest as 'Others'
    const topGenres = sortedData.slice(0, 9);
    const otherGenres = sortedData.slice(9);
    
    // Calculate total books in 'Others' category
    const otherBooksCount = otherGenres.reduce((sum, genre) => sum + genre.bookCount, 0);
    
    // Prepare labels and data
    const labels = [...topGenres.map(g => g.name)];
    const bookCounts = [...topGenres.map(g => g.bookCount)];
    
    // Add 'Others' category if there are any
    if (otherGenres.length > 0) {
      labels.push('Others');
      bookCounts.push(otherBooksCount);
    }
    
    // Generate colors
    const backgroundColors = this.generateColors(labels.length);
    const borderColors = backgroundColors.map(color => this.adjustColor(color, -20));
    
    return {
      labels: labels,
      datasets: [{
        label: 'Number of Books',
        data: bookCounts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        barThickness: 'flex',
        maxBarThickness: 40,
        minBarLength: 2
      }]
    };
  }

  isLoading = false;
  errorMessage: string | null = null;
  isConnected = false;
  
  private destroy$ = new Subject<void>();

  // Helper method to get contrast color for text based on background
  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#333' : '#fff';
  }

  constructor(
    private analyticsService: AnalyticsService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar
  ) {
    // Initialize with empty data
    this.chartData = this.prepareChartData([]);
    
    // Set initial chart height
    this.onChartTypeChange();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupWebSocket();
  }
  
  /**
   * Public method to refresh the chart data
   * @returns Promise that resolves when the chart data is refreshed
   */
  public async refresh(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.loadData();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
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
        this.totalBooks = 0;
        this.totalGenres = 0;
        this.mostPopularGenre = {
          id: 0,
          name: '',
          bookCount: 0
        };
        this.snackBar.open('Failed to load genre distribution data.', 'Dismiss', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onChartTypeChange(): void {
    // Update chart type
    this.chartType = this.selectedChartType;
    
    // Common options for both doughnut and pie charts
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: this.selectedChartType === 'doughnut' ? '60%' : '0%',
      elements: {
        arc: {
          borderWidth: 1,
          borderRadius: 4
        }
      },
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
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw as number;
              const dataset = context.dataset.data as number[];
              const total = dataset.reduce((a, b) => (a || 0) + (b || 0), 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },
        datalabels: {
          display: (context: any) => {
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
      // Hide scales for pie/doughnut charts
      scales: {
        x: { display: false },
        y: { display: false }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    };
    
    this.chartHeight = '350px';
    
    // Force chart update if data exists
    if (this.chartData?.datasets?.length) {
      this.chartData = { ...this.chartData };
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
    this.webSocketService.getGenreUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: GenreDataUpdate | null) => {
        if (update?.genreDistribution) {
          this.chartData = this.prepareChartData(update.genreDistribution);
          this.snackBar.open('Genre distribution updated', 'Dismiss', {
            duration: 2000,
            panelClass: ['success-snackbar']
          });
        }
      });
  }
}
