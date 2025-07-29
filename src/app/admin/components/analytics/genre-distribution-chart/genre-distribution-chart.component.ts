import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    // Register the datalabels plugin
    { provide: 'chartPlugins', useValue: [ChartDataLabels] }
  ],
  template: `
    <div class="flex flex-col h-full">
      <!-- Loading and Error States -->
      <div *ngIf="isLoading && !chartData" class="flex-1 flex items-center justify-center">
        <mat-spinner diameter="32"></mat-spinner>
      </div>

      <div *ngIf="errorMessage" class="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100 flex items-start">
        <mat-icon class="text-red-500 mr-2" style="font-size: 16px">error</mat-icon>
        <div>{{ errorMessage }}</div>
      </div>

      <!-- Chart Container -->
      <div *ngIf="!isLoading && !errorMessage" class="flex flex-col h-full">
        <!-- Chart Type Selector -->
        <div class="flex items-center gap-1 mb-3 bg-gray-100 p-1 rounded-md">
          <button 
            *ngFor="let option of chartTypeOptions"
            (click)="changeChartType(option.value)"
            [class.bg-white]="selectedChartType === option.value"
            [class.text-purple-700]="selectedChartType === option.value"
            [class.shadow-sm]="selectedChartType === option.value"
            class="px-3 py-1.5 text-xs rounded flex items-center transition-colors"
          >
            <mat-icon class="!w-4 !h-4 mr-1">{{ option.icon }}</mat-icon>
            {{ option.label }}
          </button>
        </div>
        <div class="flex-1 min-h-[250px]">
          <canvas baseChart
            [data]="chartData"
            [type]="selectedChartType"
            [options]="chartOptions"
            [plugins]="[]"
            (chartHover)="onChartHover($event)">
          </canvas>
        </div>
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          <!-- Total Products Card -->
          <div class="bg-indigo-50 rounded-lg p-3 sm:p-4 border border-indigo-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-indigo-700 mb-1">Total Products</p>
                <p class="text-xl sm:text-2xl font-bold text-indigo-900">{{ totalBooks | number }}</p>
              </div>
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <mat-icon class="text-indigo-600 !w-4 !h-4 sm:!w-5 sm:!h-5">book</mat-icon>
              </div>
            </div>
            <p class="text-xs text-indigo-500 mt-1">Across all genres</p>
          </div>
          
          <!-- Total Genres Card -->
          <div class="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-purple-700 mb-1">Total Genres</p>
                <p class="text-xl sm:text-2xl font-bold text-purple-900">{{ totalGenres | number }}</p>
              </div>
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <mat-icon class="text-purple-600 !w-4 !h-4 sm:!w-5 sm:!h-5">category</mat-icon>
              </div>
            </div>
            <p class="text-xs text-purple-500 mt-1">With available products</p>
          </div>
          
          <!-- Most Popular Genre Card -->
          <div class="bg-pink-50 rounded-lg p-3 sm:p-4 border border-pink-100">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-pink-700 mb-1">Most Popular</p>
                <p class="text-sm sm:text-base font-bold text-pink-900 truncate" [matTooltip]="mostPopularGenre.name || 'N/A'">
                  {{ mostPopularGenre.name || 'N/A' }}
                </p>
                <p class="text-xs text-pink-600">{{ mostPopularGenre.bookCount | number }} books</p>
              </div>
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-pink-100 flex items-center justify-center ml-2">
                <mat-icon class="text-pink-600 !w-4 !h-4 sm:!w-5 sm:!h-5">star</mat-icon>
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
  // Component state
  isLoading = false;
  errorMessage: string | null = null;
  isConnected = false;
  totalBooks = 0;
  totalGenres = 0;
  avgBooksPerGenre = 0;
  mostPopularGenre = { name: '', bookCount: 0 };

  // Chart data
  chartData: ChartData = {
    labels: [],
    datasets: []
  };

  // Chart type
  selectedChartType: ChartType = 'doughnut';
  chartType: ChartType = 'doughnut'; 
  chartTypeOptions: { value: ChartType; label: string; icon: string }[] = [
    { value: 'doughnut', label: 'Doughnut', icon: 'donut_large' },
    { value: 'pie', label: 'Pie', icon: 'pie_chart' },
  ];
  
  // Chart height for responsive design
  chartHeight = '350px';

  // Chart options with proper typing for doughnut/pie charts
  chartOptions: ChartConfiguration['options'] & { cutout?: string | number } = {
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
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw as number;
            const dataset = context.dataset.data as number[];
            const total = dataset.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      // @ts-ignore - datalabels plugin types are not fully compatible
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
          weight: 'bold' as const,
          size: 12
        },
        textAlign: 'center' as const,
        textStrokeColor: 'rgba(0, 0, 0, 0.5)',
        textStrokeWidth: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowBlur: 3
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  // Method to handle chart type change safely
  changeChartType(type: ChartType): void {
    if (this.selectedChartType !== type) {
      this.selectedChartType = type;
      this.chartType = type;
      
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.onChartTypeChange();
        this.cdr.detectChanges();
      });
    }
  }

  // Handle chart hover events
  onChartHover(event: any): void {
    // Handle hover events if needed
    // This method is intentionally left empty as we don't need to do anything special on hover
    // The event parameter is kept for future use if needed
  }

  // Generate colors for chart
  generateColors(count: number): string[] {
    const colors = [];
    const baseColors = [
      '#3B82F6', // blue-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
      '#6366F1', // indigo-500
      '#06B6D4'  // cyan-500
    ];

    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
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

  // Prepare chart data from API response
  private prepareChartData(data: GenreDistribution[]): ChartData {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Sort data by book count in descending order
    const sortedData = [...data].sort((a, b) => b.bookCount - a.bookCount);

    // Get top 10 genres
    const topGenres = sortedData.slice(0, 10);

    this.calculateStats(data);

    // Prepare labels and data
    const labels = topGenres.map(genre => genre.name);
    const bookCounts = topGenres.map(genre => genre.bookCount);
    const colors = this.generateColors(topGenres.length);

    // If there are more than 10 genres, add an 'Others' category
    if (sortedData.length > 10) {
      const otherGenres = sortedData.slice(10);
      const otherCount = otherGenres.reduce((sum, genre) => sum + genre.bookCount, 0);
      
      labels.push('Others');
      bookCounts.push(otherCount);
      colors.push('#9CA3AF'); // gray-400
    }

    // Prepare chart data
    const chartData: ChartData = {
      labels: labels,
      datasets: [
        {
          data: bookCounts,
          backgroundColor: colors,
          borderColor: colors.map(color => this.adjustColor(color, -20)),
          borderWidth: 1,
          hoverBackgroundColor: colors.map(color => this.adjustColor(color, -10)),
          hoverBorderColor: colors.map(color => this.adjustColor(color, -30)),
          hoverOffset: 4,
          borderRadius: 4,
          spacing: 2
        }
      ]
    };

    return chartData;
  }

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
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize with empty data
    this.chartData = this.prepareChartData([]);
  }

  ngOnInit(): void {
    // Load initial data
    this.loadData();
    
    // Setup WebSocket for real-time updates
    this.setupWebSocket();
    
    // Set initial chart height after view init
    setTimeout(() => {
      this.onChartTypeChange();
      this.cdr.detectChanges();
    });
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

  private calculateStats(data: GenreDistribution[]): void {
    if (!data || data.length === 0) {
      this.totalBooks = 0;
      this.totalGenres = 0;
      this.avgBooksPerGenre = 0;
      this.mostPopularGenre = { name: '', bookCount: 0 };
      return;
    }

    this.totalGenres = data.length;
    this.totalBooks = data.reduce((sum, genre) => sum + (genre.bookCount || 0), 0);
    this.avgBooksPerGenre = this.totalGenres > 0 ? Math.round(this.totalBooks / this.totalGenres) : 0;
    
    // Find the most popular genre
    const popular = data.reduce((max, genre) => 
      (genre.bookCount || 0) > max.count 
        ? { name: genre.name, count: genre.bookCount || 0 } 
        : max, 
      { name: '', count: 0 }
    );
    
    this.mostPopularGenre = {
      name: popular.name,
      bookCount: popular.count
    };
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges(); // Trigger change detection before async operation

    this.analyticsService.getGenreDistribution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: GenreDistribution[]) => {
          this.chartData = this.prepareChartData(data);
          this.calculateStats(data);
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection after data is loaded
        },
        error: (error) => {
          console.error('Error loading genre distribution:', error);
          this.errorMessage = 'Failed to load genre distribution data';
          this.isLoading = false;
          this.showError(this.errorMessage);
          this.cdr.detectChanges(); // Trigger change detection on error
        }
      });
  }

  onChartTypeChange(): void {
    // Update chart type
    this.chartType = this.selectedChartType;
    const isDoughnut = this.selectedChartType === 'doughnut';

    // Update chart options based on type - use type assertion for cutout property
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      ...(isDoughnut ? { cutout: '65%' as const } : {}),
      layout: {
        padding: 10
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 20,
            boxWidth: 12,
            color: '#4B5563',
            font: {
              size: 12,
              weight: 'bold' as const
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw as number;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        },
        // @ts-ignore - datalabels plugin types are not fully compatible
        datalabels: {
          display: (context: any) => {
            // Only show labels for larger segments to avoid clutter
            const value = context.dataset.data[context.dataIndex] as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = (value / total) * 100;
            return percentage > 5; // Only show labels for segments > 5%
          },
          formatter: (value: number, context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${percentage}%`;
          },
          color: '#fff',
          font: {
            weight: 'bold' as const,
            size: 12
          },
          textAlign: 'center' as const,
          textStrokeColor: 'rgba(0, 0, 0, 0.5)',
          textStrokeWidth: 1
        }
      },
      elements: {
        arc: {
          borderWidth: 2,
          borderRadius: 4
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart' as const
      }
    };
    
    this.chartHeight = '350px';
    
    // Force chart update if data exists
    if (this.chartData?.datasets?.length) {
      this.chartData = { ...this.chartData };
    }
  }

  ngAfterViewInit(): void {
    // Ensure proper dimensions after view is initialized
    this.onChartTypeChange();
    this.cdr.detectChanges();
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
