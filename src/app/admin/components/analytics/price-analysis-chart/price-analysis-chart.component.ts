import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// RxJS
import { Subject } from 'rxjs';
import { finalize, takeUntil, tap, map, catchError } from 'rxjs/operators';

// Highcharts
import * as Highcharts from 'highcharts';

// Extend Highcharts types with our custom properties
declare module 'highcharts' {
  interface Point {
    margin?: number;
    custom?: {
      margin: number;
    };
  }

  interface TooltipFormatterContextObject {
    point: Point;
    x?: number | string;
    y?: number | string;
    key?: string;
    percentage?: number;
    total?: number;
    series: {
      name: string;
      color: string;
    };
  }

  interface Chart {
    showLoading(loadingText?: string): void;
    hideLoading(): void;
    loading?: boolean;
    update(options: Options, redraw?: boolean, oneToOne?: boolean, animation?: boolean | AnimationOptionsObject): void;
    redraw(): void;
  }

  interface SeriesTooltipOptionsObject {
    useHTML?: boolean;
    formatter?: TooltipFormatterCallbackFunction;
  }
}

// Local interfaces
interface ChartPoint extends Highcharts.PointOptionsObject {
  margin?: number;
  name?: string;
  custom?: {
    margin: number;
  };
}

interface ProductPoint extends Highcharts.PointOptionsObject {
  margin: number;
}

// Dynamically load Highcharts modules
try {
  // Using require to handle CommonJS modules
  const HighchartsMore = require('highcharts/highcharts-more');
  const HighchartsExporting = require('highcharts/modules/exporting');
  const HighchartsExportData = require('highcharts/modules/export-data');
  const HighchartsAccessibility = require('highcharts/modules/accessibility');

  // Initialize Highcharts modules if Highcharts is available
  if (typeof Highcharts === 'object') {
    HighchartsMore(Highcharts);
    HighchartsExporting(Highcharts);
    HighchartsExportData(Highcharts);
    HighchartsAccessibility(Highcharts);
  }
} catch (error) {
  console.warn('Could not load Highcharts modules:', error);
  // Continue without the modules
}

// Services and Models
import { AnalyticsService } from '../../../services/analytics.service';
import { WebSocketService } from '../../../services/websocket.service';
import { 
  Genre, 
  PriceAnalysisData, 
  PriceAnalysisProduct, 
  PriceDataUpdate, 
  PriceAnalysisStats 
} from '../../../models/analytics.model';
import { of } from 'rxjs';

@Component({
  selector: 'app-price-analysis-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    RouterModule
  ],
  template: `
    <div class="flex flex-col h-full bg-gray-50 p-4 md:p-6">
      <!-- Header Section -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <mat-icon class="text-purple-600">show_chart</mat-icon>
              Price Analysis
            </h2>
            <p class="text-gray-600 mt-1">Analyze cost vs. selling price by genre</p>
          </div>
          
          <!-- Chart Type Selector -->
          <div class="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
            <button 
              *ngFor="let option of chartTypeOptions"
              (click)="changeChartType(option.value)"
              [class.bg-purple-50]="chartType === option.value"
              [class.text-purple-700]="chartType === option.value"
              [class.font-medium]="chartType === option.value"
              class="px-4 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-100"
            >
              <mat-icon class="!w-5 !h-5 mr-1.5">{{ option.icon }}</mat-icon>
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Custom Genre Selector -->
        <div class="relative w-full max-w-xs">
          <div class="relative">
            <button 
              type="button"
              (click)="toggleGenreMenu()"
              (blur)="closeGenreMenu()"
              class="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-150"
              [class.ring-2]="isGenreMenuOpen"
              [class.ring-purple-500]="isGenreMenuOpen"
              [class.border-purple-500]="isGenreMenuOpen"
            >
              <div class="flex items-center">
                <span *ngIf="selectedGenreId" class="w-3 h-3 rounded-full mr-2" [style.background]="getGenreColor(selectedGenreId)"></span>
                <span class="text-gray-700 truncate">
                  {{ getSelectedGenreName() || 'Select a genre' }}
                </span>
              </div>
              <svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <!-- Dropdown menu -->
            <div 
              *ngIf="isGenreMenuOpen"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto"
              role="menu"
              aria-orientation="vertical"
              tabindex="-1"
            >
              <!-- All Genres Option -->
              <button
                type="button"
                (click)="onGenreChange(null)"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                [class.bg-gray-100]="!selectedGenreId"
                role="menuitem"
              >
                <span class="w-3 h-3 rounded-full mr-2 bg-gray-300"></span>
                <span>All Genres</span>
              </button>
              
              <!-- Genre Options -->
              <div *ngFor="let genre of genres" class="border-t border-gray-100">
                <button
                  type="button"
                  (click)="onGenreChange(genre.id)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                  [class.bg-purple-50]="selectedGenreId === genre.id"
                  role="menuitem"
                >
                  <span class="w-3 h-3 rounded-full mr-2" [style.background]="getGenreColor(genre.id)"></span>
                  <span class="truncate">{{ genre.name }}</span>
                  <span *ngIf="selectedGenreId === genre.id" class="ml-auto text-purple-600">
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Selected genre hint -->
          <p *ngIf="selectedGenreId" class="mt-1 text-xs text-gray-500">
            Showing data for {{ getSelectedGenreName() }}
          </p>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-lg font-medium text-gray-800">
            {{ chartType === 'scatter' ? 'Cost vs. Selling Price' : 'Profit Margin Analysis' }}
          </h3>
        </div>
        <!-- Chart Content -->
        <div class="flex-1 flex flex-col relative">
          <!-- Loading State -->
          <div *ngIf="loading" class="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <mat-spinner diameter="48" class="mb-4"></mat-spinner>
            <p class="text-gray-600 font-medium">Loading chart data...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error" class="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center">
            <mat-icon class="text-red-500 !w-12 !h-12 mb-3">error_outline</mat-icon>
            <h4 class="text-lg font-medium text-gray-800 mb-1">Unable to load chart</h4>
            <p class="text-gray-600 mb-4">{{ error }}</p>
            <button 
              mat-flat-button 
              color="primary" 
              (click)="loadChartData()"
              class="!bg-purple-600 hover:!bg-purple-700"
            >
              <mat-icon class="!w-5 !h-5 mr-1">refresh</mat-icon>
              Retry
            </button>
          </div>

          <!-- Chart Container -->
          <div #chartContainer class="w-full h-full min-h-[400px] p-4"></div>
        </div>
      </div>

      <!-- Stats Section -->
      <div *ngIf="chartData?.stats" class="mt-6">
        <h3 class="text-lg font-medium mb-4 text-gray-800 flex items-center">
          <mat-icon class="!w-5 !h-5 mr-1.5 text-purple-500">analytics</mat-icon>
          Price Statistics
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-1">
              <div class="text-sm font-medium text-gray-500">Avg. Cost Price</div>
              <mat-icon class="!w-5 !h-5 text-blue-500">payments</mat-icon>
            </div>
            <div class="text-2xl font-bold text-gray-900">
              {{ getStatValue('avgCostPrice') | currency:'INR':'symbol':'1.2-2' }}
            </div>
            <div class="text-xs text-gray-400 mt-1">Per unit cost</div>
          </div>
          
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-1">
              <div class="text-sm font-medium text-gray-500">Avg. Selling Price</div>
              <mat-icon class="!w-5 !h-5 text-green-500">price_check</mat-icon>
            </div>
            <div class="text-2xl font-bold text-gray-900">
              {{ getStatValue('avgSellingPrice') | currency:'INR':'symbol':'1.2-2' }}
            </div>
            <div class="text-xs text-gray-400 mt-1">Per unit price</div>
          </div>
          
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-1">
              <div class="text-sm font-medium text-gray-500">Avg. Profit Margin</div>
              <mat-icon class="!w-5 !h-5 text-emerald-500">trending_up</mat-icon>
            </div>
            <div class="text-2xl font-bold text-gray-900">
              {{ getStatValue('avgProfitMargin') | number:'1.2-2' }}%
            </div>
            <div class="text-xs text-gray-400 mt-1">Average margin</div>
          </div>
          
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-1">
              <div class="text-sm font-medium text-gray-500">Total Products</div>
              <mat-icon class="!w-5 !h-5 text-purple-500">inventory_2</mat-icon>
            </div>
            <div class="text-2xl font-bold text-gray-900">
              {{ getStatValue('totalProducts') | number }}
            </div>
            <div class="text-xs text-gray-400 mt-1">In selected genre</div>
          </div>
        </div>
    </div>
  `,
  styles: [`
    .chart-card {
      margin: 1rem;
      padding: 1rem;
    }

    .chart-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-top: 1rem;
    }

    .genre-select {
      min-width: 200px;
    }

    .chart-container {
      width: 100%;
      min-height: 400px;
      position: relative;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #f44336;
      padding: 1rem;
      background-color: #ffebee;
      border-radius: 4px;
      margin: 1rem 0;
    }
  `]
})
export class PriceAnalysisChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef<HTMLDivElement>;
  // Chart configuration
  private chart: Highcharts.Chart | null = null;
  chartData: PriceAnalysisData | null = null;
  loading = false;
  error: string | null = null;
  genres: Genre[] = [];
  selectedGenreId: number | null = null;
  chartType: 'scatter' | 'bubble' = 'scatter';
  chartTypeOptions: { label: string; value: 'scatter' | 'bubble'; icon: string }[] = [
    { label: 'Scatter', value: 'scatter', icon: 'scatter_plot' },
    { label: 'Bubble', value: 'bubble', icon: 'bubble_chart' }
  ];
  
  // Generate consistent colors for genres
  private genreColors = new Map<number, string>();
  private destroy$ = new Subject<void>();
  private currentGenreName = '';

  constructor(
    private analyticsService: AnalyticsService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { 
    // Initialize genre colors
    this.initializeGenreColors();
  }

  // Helper method to safely get stat values with a fallback
  public getStatValue(
    statName: keyof PriceAnalysisStats,
    fallback: number = 0
  ): number {
    if (!this.chartData?.stats) {
      return fallback;
    }
    return this.chartData.stats[statName as keyof typeof this.chartData.stats] ?? fallback;
  }

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.loading = true;
    this.loadGenres();
    this.setupWebSocket();
  }
  
  /**
   * Public method to refresh the chart data
   * @returns Promise that resolves when the chart data is refreshed
   */
  public async refresh(): Promise<void> {
    return this.loadChartData();
  }
  
  // Get color for a genre
  getGenreColor(genreId: number): string {
    return this.genreColors.get(genreId) || '#9CA3AF';
  }
  
  // Initialize genre colors with consistent hashing
  private initializeGenreColors(): void {
    const colors = [
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
    
    // Simple hash function to get consistent colors for genres
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    // Pre-generate colors for the first 100 genres
    for (let i = 1; i <= 100; i++) {
      const colorIndex = hashCode(`genre-${i}`) % colors.length;
      this.genreColors.set(i, colors[colorIndex]);
    }
  }
  
  // Get selected genre name
  getSelectedGenreName(): string {
    if (!this.selectedGenreId) return 'All Genres';
    const genre = this.genres.find(g => g.id === this.selectedGenreId);
    return genre ? genre.name : 'Selected Genre';
  }
  
  // Track by function for better ngFor performance
  trackByGenreId(index: number, genre: Genre): number {
    return genre.id;
  }
  
  // Change chart type with animation
  changeChartType(type: 'scatter' | 'bubble'): void {
    if (this.chartType !== type) {
      this.chartType = type;
      this.onChartTypeChange();
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit called');
    console.log('Chart container in ngAfterViewInit:', !!this.chartContainer?.nativeElement);
    if (this.selectedGenreId) {
      this.loadChartData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up chart
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private loadGenres(): void {
    console.log('Loading genres...');
    
    this.analyticsService.getGenres()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (genres: Genre[]) => {
          console.log('Received genres:', genres);
          this.genres = genres;
          
          if (this.genres.length > 0) {
            this.selectedGenreId = this.genres[0].id;
            console.log('Selected initial genre ID:', this.selectedGenreId);
            this.loadChartData();
          } else {
            this.loading = false;
            this.error = 'No genres available';
            this.showError(this.error);
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading genres:', error);
          this.loading = false;
          this.error = 'Failed to load genres';
          this.showError(this.error);
          this.cdr.detectChanges();
        }
      });
  }

  isGenreMenuOpen = false;
  
  toggleGenreMenu(): void {
    this.isGenreMenuOpen = !this.isGenreMenuOpen;
  }
  
  closeGenreMenu(): void {
    setTimeout(() => {
      this.isGenreMenuOpen = false;
    }, 200);
  }
  
  onGenreChange(genreId: number | null): void {
    console.log('Genre changed to:', genreId);
    this.selectedGenreId = genreId;
    this.isGenreMenuOpen = false;
    this.loadChartData();
  }

  onChartTypeChange(): void {
    if (this.chart && this.chartData) {
      this.updateChart();
    }
  }

  public loadChartData(): void {
    console.log('loadChartData called with genreId:', this.selectedGenreId);
    if (!this.selectedGenreId) {
      console.log('No genre selected, skipping data load');
      return;
    }

    console.log('Loading chart data for genre ID:', this.selectedGenreId);
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    console.log('Calling analyticsService.getPriceAnalysis with genreId:', this.selectedGenreId);
    
    this.analyticsService.getPriceAnalysis(this.selectedGenreId)
      .pipe(
        tap(() => this.loading = false),
        catchError(err => {
          this.loading = false;
          this.error = 'Failed to load price analysis data';
          console.error('Error loading price analysis:', err);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        if (data) {
          this.chartData = data.data;  
          this.currentGenreName = this.genres.find(g => g.id === this.selectedGenreId)?.name || '';
          
          // Initialize or update the chart
          if (this.chart) {
            this.updateChart();
          } else if (this.chartContainer?.nativeElement) {
            this.initializeChart();
          }
          
          this.updateChartData(); // Emit the updated data
        }
      });
  }

  private updateChartData(): void {
    // No longer need to emit data to parent
  }

  private initializeChart(): void {
    console.log('initializeChart called');
    console.log('Chart container exists:', !!this.chartContainer?.nativeElement);
    
    if (!this.chartContainer?.nativeElement) {
      console.error('Chart container not found');
      return;
    }
    
    // Ensure the container has proper dimensions
    const container = this.chartContainer.nativeElement;
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '400px'; // Ensure minimum height for better visibility

    try {
      const chartData = this.getChartData();
      
      if (!chartData.length) {
        if (this.chart) {
          this.chart.showLoading('No data available');
        }
        return;
      }

      const options: Highcharts.Options = {
        chart: {
          type: this.chartType,
          zooming: {
            type: 'xy'
          },
          backgroundColor: 'transparent'
        },
        title: {
          text: `Price Analysis ${this.selectedGenreId ? `- ${this.currentGenreName}` : ''}`,
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        subtitle: {
          text: `Showing ${chartData.length} products`
        },
        xAxis: {
          title: {
            text: 'Cost Price (₹)'
          },
          startOnTick: true,
          endOnTick: true,
          showLastLabel: true
        },
        yAxis: {
          title: {
            text: 'Selling Price (₹)'
          }
        },
        legend: {
          enabled: true
        },
        plotOptions: {
          scatter: {
            states: {
              hover: {
                enabled: true,
                lineColor: 'rgb(100,100,100)'
              }
            },
            marker: {
              radius: 5,
              states: {
                hover: {
                  enabled: false
                }
              }
            },
            tooltip: {
              useHTML: true,
              formatter: this.getTooltipFormatter()
            }
          },
          bubble: {
            minSize: 10,
            maxSize: '10%',
            tooltip: {
              useHTML: true,
              formatter: this.getTooltipFormatter()
            }
          }
        },
        series: [{
          type: this.chartType,
          data: chartData,
          tooltip: {
            useHTML: true,
            formatter: this.getTooltipFormatter()
          },
          states: {
            hover: {
              halo: {
                size: 5,
                opacity: 0.2
              }
            }
          }
        } as Highcharts.SeriesOptionsType],
        tooltip: {
          useHTML: true,
          formatter: this.getTooltipFormatter()
        },
        exporting: {
          enabled: true
        }
      }
      console.log('Initializing chart with options:', options);
      
      try {
        this.chart = new Highcharts.Chart(
          this.chartContainer.nativeElement,
          options
        );
        console.log('Highcharts chart instance created successfully');
        console.log('Chart container dimensions:', {
          width: this.chartContainer.nativeElement.offsetWidth,
          height: this.chartContainer.nativeElement.offsetHeight
        });
      } catch (chartError) {
        console.error('Error creating Highcharts instance:', chartError);
        throw chartError;
      }
    } catch (error) {
      console.error('Error initializing chart:', error);
      this.error = 'Failed to initialize chart. Please refresh the page or try again later.';
      this.showError(this.error);
      this.cdr.detectChanges();
    }
  }

  private updateChart(): void {
    if (!this.chart) {
      this.initializeChart();
      return;
    }
    
    // Ensure the chart container has proper dimensions before updating
    if (this.chartContainer?.nativeElement) {
      const container = this.chartContainer.nativeElement;
      container.style.width = '100%';
      container.style.height = '100%';
    }

    try {
      const chartData = this.getChartData();
      
      if (!chartData.length) {
        this.chart.showLoading('No data available');
        return;
      }

      this.chart.update({
        series: [{
          type: this.chartType,
          data: chartData,
          tooltip: {
            useHTML: true,
            formatter: this.getTooltipFormatter()
          },
          states: {
            hover: {
              halo: {
                size: 5,
                opacity: 0.2
              }
            }
          }
        } as Highcharts.SeriesOptionsType],
        title: {
          text: `Price Analysis ${this.selectedGenreId ? `- ${this.currentGenreName}` : ''}`
        },
        subtitle: {
          text: `Showing ${chartData.length} products`
        }
      });

      // Hide loading indicator after update
      if (this.chart.loading) {
        this.chart.hideLoading();
      }
    } catch (error) {
      console.error('Error updating chart:', error);
      this.error = 'Error updating chart. Please try again.';
      this.showError(this.error);
    }
  }

  private getChartData(): ChartPoint[] {
    if (!this.chartData?.products?.length) {
      return [];
    }

    return this.chartData.products.map(product => {
      const margin = (product.profitMargin || 0) * 100;
      return {
        x: product.costPrice || 0,
        y: product.sellingPrice || 0,
        z: this.chartType === 'bubble' ? Math.abs(margin) * 0.5 : undefined,
        margin: margin,
        name: product.title || 'Unknown Product',
        color: this.getPointColor(product)
      } as any; // Using type assertion to avoid TypeScript errors with custom properties
    });
  }

  private getTooltipFormatter(): Highcharts.TooltipFormatterCallbackFunction {
    // Use a type assertion to work around the TypeScript type checking
    // for the Highcharts tooltip formatter
    return function(this: any) {
      try {
        const point = this.point as Highcharts.Point & { margin?: number; name?: string; x?: number; y?: number };
        const x = typeof point.x === 'number' ? point.x.toFixed(2) : 'N/A';
        const y = typeof point.y === 'number' ? point.y.toFixed(2) : 'N/A';
        const margin = point.margin?.toFixed(2) || '0.00';
        const name = point.name || 'Product';
        
        // Use string concatenation instead of template literals for better compatibility
        return [
          '<div style="padding: 8px; min-width: 200px">',
          '<b>', name, '</b><br>',
          '<hr style="margin: 4px 0">',
          'Cost: ₹', x, '<br>',
          'Selling: ₹', y, '<br>',
          'Margin: ', margin, '%',
          '</div>'
        ].join('');
      } catch (error) {
        console.error('Error in tooltip formatter:', error);
        return 'Error loading tooltip';
      }
    };
  }

  private getPointColor(product: PriceAnalysisProduct): string {
    if (!product.costPrice || !product.sellingPrice) return '#CCCCCC'; // Default gray for invalid data
    
    const profitMargin = product.profitMargin || ((product.sellingPrice - product.costPrice) / product.costPrice);
    
    // Color based on profit margin
    if (profitMargin > 0.5) return '#2ecc71'; // Green for high margin
    if (profitMargin > 0.2) return '#3498db'; // Blue for medium-high margin
    if (profitMargin > 0) return '#f39c12';   // Orange for low margin
    if (profitMargin === 0) return '#95a5a6'; // Gray for break-even
    return '#e74c3c'; // Red for loss
  }

  private setupWebSocket(): void {
    this.webSocketService.getPriceUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (update) => {
          if (update && update.genreId === this.selectedGenreId) {
            this.showSuccess('Price data updated. Refreshing...');
            this.loadChartData();
          }
        },
        error: (error) => {
          console.error('WebSocket error:', error);
          this.showError('Connection to real-time updates lost. Please refresh the page.');
        }
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}
