import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

// Extend Highcharts types with our custom point properties
type CustomPoint = {
  x?: number;
  y?: number;
  margin?: number;
  name?: string;
  custom?: {
    margin: number;
  };
};

declare module 'highcharts' {
  interface Point extends CustomPoint {}
  interface PointOptionsObject extends CustomPoint {}
}

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
    <div class="flex flex-col h-full relative">
      <!-- Loading Overlay -->
      <div *ngIf="loading && !chartData" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
        <mat-spinner diameter="32"></mat-spinner>
      </div>
      
      <!-- Chart Container Wrapper -->
      <div class="flex-1 min-h-[400px] relative">

      <!-- Error State -->
      <div *ngIf="error" class="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100 flex items-start">
        <mat-icon class="text-red-500 mr-2" style="font-size: 16px">error</mat-icon>
        <div>{{ error }}</div>
      </div>

      <!-- Chart Content -->
      <div class="flex flex-col h-full w-full" [class.opacity-50]="loading">
        <!-- Header with controls -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <!-- Chart Type Selector -->
          <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
            <button 
              *ngFor="let option of chartTypeOptions"
              (click)="changeChartType(option.value)"
              [class.bg-white]="chartType === option.value"
              [class.text-purple-700]="chartType === option.value"
              [class.shadow-sm]="chartType === option.value"
              class="px-3 py-1.5 text-xs rounded flex items-center transition-colors"
            >
              <mat-icon class="!w-4 !h-4 mr-1">{{ option.icon }}</mat-icon>
              {{ option.label }}
            </button>
          </div>

          <!-- Genre Selection -->
          <div class="relative w-full sm:w-64">
            <button 
              (click)="toggleGenreMenu()"
              (blur)="closeGenreMenu()"
              type="button" 
              class="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm flex items-center justify-between"
              aria-haspopup="listbox"
              aria-expanded="true"
              aria-labelledby="listbox-label"
            >
              <span class="flex items-center">
                <span class="block truncate">
                  {{ selectedGenre ? selectedGenre.name : 'Select a genre' }}
                </span>
              </span>
              <span class="ml-3 flex items-center pr-2 pointer-events-none">
                <mat-icon class="h-5 w-5 text-gray-400">arrow_drop_down</mat-icon>
              </span>
            </button>

            <!-- Genre dropdown menu -->
            <div 
              *ngIf="isGenreMenuOpen"
              class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
              tabindex="-1"
              role="listbox"
              aria-labelledby="listbox-label"
              aria-activedescendant="listbox-option-0"
            >
              <div 
                *ngFor="let genre of genres; let i = index"
                (click)="onGenreSelect(genre)"
                [ngClass]="{
                  'bg-indigo-600 text-white': selectedGenreId === genre.id,
                  'text-gray-900': selectedGenreId !== genre.id
                }"
                class="cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                id="listbox-option-{{i}}"
                role="option"
              >
                <div class="flex items-center">
                  <span 
                    [ngClass]="{
                      'font-semibold': selectedGenreId === genre.id,
                      'font-normal': selectedGenreId !== genre.id
                    }" 
                    class="block truncate"
                  >
                    {{ genre.name }}
                  </span>
                </div>
                <span 
                  *ngIf="selectedGenreId === genre.id"
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-white"
                >
                  <mat-icon class="h-5 w-5">check</mat-icon>
                </span>
              </div>
              <div 
                *ngIf="!genres.length"
                class="text-gray-500 p-3 text-sm"
              >
                No genres available
              </div>
            </div>
          </div>
        </div>

        <!-- Chart Container -->
        <div class="flex-1 min-h-[250px] border rounded-lg bg-white p-2">
          <div #chartContainer class="w-full h-full min-h-[400px]"></div>
        </div>

        <!-- Stats -->
        <div *ngIf="chartData?.stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <!-- Average Cost Card -->
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-500">Avg. Cost</div>
              <mat-icon class="!w-5 !h-5 text-blue-500">payments</mat-icon>
            </div>
            <div class="text-xl font-bold text-gray-900">
              {{ getStatValue('avgCostPrice') | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="text-xs text-gray-400 mt-1">Per unit</div>
          </div>
          
          <!-- Average Price Card -->
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-500">Avg. Price</div>
              <mat-icon class="!w-5 !h-5 text-green-500">price_change</mat-icon>
            </div>
            <div class="text-xl font-bold text-gray-900">
              {{ getStatValue('avgSellingPrice') | currency:'INR':'symbol':'1.0-0' }}
            </div>
            <div class="text-xs text-gray-400 mt-1">Selling price</div>
          </div>
          
          <!-- Margin Card -->
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-500">Avg. Margin</div>
              <mat-icon class="!w-5 !h-5 text-purple-500">trending_up</mat-icon>
            </div>
            <div class="text-xl font-bold text-gray-900">
              {{ getStatValue('avgProfitMargin') | number:'1.1-1' }}%
            </div>
            <div class="text-xs text-gray-400 mt-1">Profit margin</div>
          </div>
          
          <!-- Total Products Card -->
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-500">Total Products</div>
              <mat-icon class="!w-5 !h-5 text-amber-500">inventory_2</mat-icon>
            </div>
            <div class="text-xl font-bold text-gray-900">
              {{ getStatValue('totalProducts') | number }}
            </div>
            <div class="text-xs text-gray-400 mt-1">In selected genre</div>
          </div>
        </div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100% !important;
      height: 100% !important;
      min-height: 400px;
    }
    
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
export class PriceAnalysisChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef<HTMLDivElement>;
  
  // Chart instance and configuration
  private chart: Highcharts.Chart | null = null;
  private resizeObserver!: ResizeObserver;
  private resizeTimer: any;
  private isInitialized = false;
  chartData: PriceAnalysisData | null = null;
  loading = false;
  error: string | null = null;
  genres: Genre[] = [];
  selectedGenreId: number | null = null;
  get selectedGenre(): Genre | null {
    return this.genres.find(g => g.id === this.selectedGenreId) || null;
  }
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
    
    // Load genres first
    this.loadGenres();
    
    // Setup WebSocket for real-time updates
    this.setupWebSocket();
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit - Initializing chart component');
    
    // Set up resize observer for the chart container
    this.setupResizeObserver();
    
    // Initial check for container
    this.ensureChartContainer();
    
    // Set up a mutation observer to watch for container changes
    this.setupContainerObserver();
  }
  
  private setupResizeObserver(): void {
    if (!this.chartContainer?.nativeElement) {
      console.warn('Chart container not available for resize observation');
      return;
    }

    this.resizeObserver = new ResizeObserver(entries => {
      // Debounce resize events
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        entries.forEach(entry => {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            console.log('Container resized, updating chart dimensions');
            this.updateChartDimensions();
          }
        });
      }, 100);
    });

    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }
  
  private updateChartDimensions(): void {
    if (!this.chart || !this.chartContainer?.nativeElement) {
      return;
    }

    const container = this.chartContainer.nativeElement;
    const width = container.offsetWidth;
    const height = Math.max(container.offsetHeight, 400);

    if (width > 0 && height > 0) {
      this.chart.setSize(width, height, false);
    }
  }
  
  private ensureChartContainer(currentRetry = 0, maxRetries = 10): void {
    if (this.chart) return;
    if (!this.chartData) return;
    
    const container = this.chartContainer?.nativeElement;
    if (!container) {
      if (currentRetry < maxRetries) {
        setTimeout(() => this.ensureChartContainer(currentRetry + 1, maxRetries), 100);
      }
      return;
    }
    
    if (!document.body.contains(container) || container.offsetParent === null) {
      if (currentRetry < maxRetries) {
        setTimeout(() => this.ensureChartContainer(currentRetry + 1, maxRetries), 100);
      }
      return;
    }
    
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      if (currentRetry < maxRetries) {
        setTimeout(() => this.ensureChartContainer(currentRetry + 1, maxRetries), 100);
      }
      return;
    }
    
    this.initializeChart();
  }
  
  private setupContainerObserver(): void {
    if (!this.chartContainer) return;
    
    const observer = new MutationObserver(() => {
      if (!this.chart && this.chartData) {
        this.ensureChartContainer();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      observer.disconnect();
    });
  }
  
  private getSelectedGenreName(): string {
    if (!this.selectedGenreId) return 'All Genres';
    const genre = this.genres.find(g => g.id === this.selectedGenreId);
    return genre ? genre.name : 'Selected Genre';
  }
  
  private initializeGenreColors(): void {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#06B6D4'
    ];
    
    const hashCode = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    for (let i = 1; i <= 100; i++) {
      const colorIndex = hashCode(`genre-${i}`) % colors.length;
      this.genreColors.set(i, colors[colorIndex]);
    }
  }

  /**
   * Changes the chart type and reinitializes the chart
   * @param type The new chart type ('scatter' | 'bubble')
   */
  public changeChartType(type: 'scatter' | 'bubble'): void {
    if (this.chartType !== type) {
      this.chartType = type;
      this.initializeChart();
    }
  }

  /**
   * Public method to refresh the chart data
   * @returns Promise that resolves when the chart data is loaded
   */
  public refresh(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.loadChartData();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up chart resources
    this.destroyChart();
    
    // Complete all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyChart();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
  }

  private destroyChart(): void {
    if (!this.chart) return;
    
    try {
      // Store reference to the chart
      const chart = this.chart as any; // Use type assertion to access renderTo
      this.chart = null;
      
      // Use requestAnimationFrame to ensure smooth cleanup
      requestAnimationFrame(() => {
        try {
          // Check if the chart is still attached to the DOM
          if (chart.renderTo?.parentNode) {
            chart.destroy();
          }
        } catch (e) {
          console.error('Error destroying chart:', e);
        }
      });
    } catch (e) {
      console.error('Error during chart cleanup:', e);
    }
    
    // Clear the container if it exists
    if (this.chartContainer?.nativeElement) {
      this.chartContainer.nativeElement.innerHTML = '';
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
  
  onGenreSelect(genre: Genre): void {
    console.log('Genre selected:', genre);
    if (this.selectedGenreId !== genre.id) {
      this.selectedGenreId = genre.id;
      this.isGenreMenuOpen = false;
      this.loadChartData();
    }
  }

  onGenreChange(event: any): void {
    // This is kept for compatibility with mat-select if needed
    this.selectedGenreId = event.value;
    this.loadChartData();
  }

  onChartTypeChange(): void {
    if (this.chart && this.chartData) {
      this.updateChart();
    }
  }

  private async loadChartData(): Promise<void> {
    console.log('loadChartData called with genreId:', this.selectedGenreId);
    
    // Reset state
    this.loading = true;
    this.error = null;
    this.chartData = null;
    this.cdr.detectChanges();
    
    // Clear any existing chart
    this.destroyChart();
    
    if (!this.selectedGenreId) {
      console.log('No genre selected, skipping data load');
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Ensure container is ready before proceeding
    const containerReady = await this.waitForContainer();
    if (!containerReady) {
      console.error('Giving up on loading chart data - container not ready');
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Get container reference
    const container = this.chartContainer?.nativeElement;
    
    // Ensure the chart container is ready
    if (!container) {
      console.error('Chart container not found');
      this.error = 'Chart container not available';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Reset container styles
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '400px';
    container.innerHTML = ''; // Clear any existing content

    console.log('Loading chart data for genre ID:', this.selectedGenreId);
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    console.log('Calling analyticsService.getPriceAnalysis with genreId:', this.selectedGenreId);
    
    this.analyticsService.getPriceAnalysis(this.selectedGenreId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
        catchError(err => {
          this.error = 'Failed to load price analysis data. Please try again.';
          console.error('Error loading price analysis:', err);
          this.showError(this.error);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            this.chartData = response.data;
            this.currentGenreName = this.genres.find(g => g.id === this.selectedGenreId)?.name || '';
            
            // Destroy existing chart if it exists
            if (this.chart) {
              this.destroyChart();
            }
            
            // Initialize new chart
            if (this.chartContainer?.nativeElement) {
              // Initialize chart with retry logic in the next tick
              Promise.resolve().then(() => {
                this.initializeChart();
                this.cdr.detectChanges();
              });
            }
          }
        },
        error: (err) => {
          console.error('Error in subscription:', err);
          this.error = 'An error occurred while loading the chart data.';
          this.showError(this.error);
        }
      });
  }

  private updateChartData(): void {
    // No longer need to emit data to parent
  }

  /**
   * Waits for the chart container to be available in the DOM
   */
  private async waitForContainer(maxRetries = 10, delay = 100): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      if (this.isContainerReady()) {
        console.log('Container is ready');
        return true;
      }
      
      console.log(`Waiting for container... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.error(`Container not ready after ${maxRetries} attempts`);
    return false;
  }
  
  private isContainerReady(): boolean {
    if (!this.chartContainer?.nativeElement) {
      return false;
    }
    
    const container = this.chartContainer.nativeElement;
    return document.body.contains(container) && 
           container.offsetParent !== null && 
           container.offsetWidth > 0 && 
           container.offsetHeight > 0;
  }

  private initializeChart(): void {
    console.log('initializeChart called');
    
    if (!this.chartContainer?.nativeElement) {
      console.error('Cannot initialize chart: container not available');
      return;
    }
    
    const container = this.chartContainer.nativeElement;
    
    // Ensure container has explicit dimensions
    const containerWidth = Math.max(container.offsetWidth || 800, 100); // Minimum width of 100px
    const containerHeight = Math.max(container.offsetHeight || 400, 400); // Minimum height of 400px
    
    // Set explicit dimensions
    container.style.width = `${containerWidth}px`;
    container.style.height = `${containerHeight}px`;
    container.style.minHeight = '400px';
    container.style.position = 'relative';
    
    // Clear any existing content
    container.innerHTML = '';
    
    if (!this.chartData?.products?.length) {
      console.warn('No chart data available');
      this.error = 'No data available for the selected genre';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    
    // Ensure container is visible and has dimensions
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '400px';
    container.innerHTML = ''; // Clear any existing content
    
    try {
      const chartData = this.getChartData();
      
      if (!chartData.length) {
        console.warn('No valid data points to display');
        this.error = 'No valid data points to display';
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      // Double-check container is still in the DOM
      if (!document.body.contains(container)) {
        console.warn('Chart container is not in the DOM, will retry...');
        this.ensureChartContainer(0, 3); // Retry up to 3 times with 100ms delay
        return;
      }

      // Create chart options
      const options: Highcharts.Options = {
        chart: {
          type: this.chartType,
          width: container.offsetWidth,
          height: container.offsetHeight,
          backgroundColor: 'transparent',
          style: {
            fontFamily: 'Roboto, "Helvetica Neue", sans-serif'
          },
          animation: true,
          zooming: {
            type: 'xy'
          }
        },
        title: {
          text: `Price Analysis - ${this.getSelectedGenreName()}`,
          style: {
            color: '#333',
            fontSize: '16px',
            fontWeight: '500'
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
          showLastLabel: true,
          showFirstLabel: true
        },
        yAxis: {
          title: {
            text: 'Selling Price (₹)'
          },
          min: 0
        },
        legend: {
          enabled: true,
          layout: 'horizontal',
          align: 'center',
          verticalAlign: 'bottom',
          borderWidth: 0,
          itemStyle: {
            color: '#333',
            fontSize: '12px'
          }
        },
        plotOptions: {
          scatter: {
            marker: {
              radius: 5,
              states: {
                hover: {
                  enabled: true,
                  lineColor: 'rgb(100,100,100)'
                }
              }
            },
            states: {
              hover: {
                enabled: true,
                halo: {
                  size: 5,
                  opacity: 0.2
                }
              }
            }
          },
          bubble: {
            minSize: 10,
            maxSize: '10%'
          }
        },
        series: [{
          type: this.chartType,
          name: 'Products',
          data: chartData,
          color: '#3f51b5',
          marker: {
            fillColor: 'rgba(63, 81, 181, 0.8)',
            lineColor: 'rgba(63, 81, 181, 1)',
            lineWidth: 1,
            radius: 4,
            states: {
              hover: {
                enabled: true,
                lineWidth: 2
              }
            }
          },
          tooltip: {
            useHTML: true,
            formatter: this.getTooltipFormatter()
          }
        }],
        tooltip: {
          useHTML: true,
          formatter: this.getTooltipFormatter()
        },
        credits: {
          enabled: false
        }
      };

      // Create the chart
      try {
        this.chart = Highcharts.chart(container, options);
        
        // Ensure the chart is properly sized
        setTimeout(() => {
          if (this.chart) {
            this.chart.reflow();
          }
        }, 100);
        
        console.log('Highcharts chart instance created successfully');
        console.log('Chart container dimensions:', {
          width: container.offsetWidth,
          height: container.offsetHeight
        });
        
        // Clear any loading states
        this.error = null;
        this.loading = false;
        this.cdr.detectChanges();
        
      } catch (chartError) {
        console.error('Error creating Highcharts instance:', chartError);
        throw chartError;
      }
    } catch (error) {
      console.error('Error initializing chart:', error);
      this.error = 'Failed to initialize chart: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Get chart data in the format expected by Highcharts
   */
  private getChartData(): Array<{
    x: number;
    y: number;
    z?: number;
    margin: number;
    name: string;
    color: string;
  }> {
    if (!this.chartData?.products?.length) {
      return [];
    }

    return this.chartData.products.map((product: any) => {
      const margin = (product.profitMargin || 0) * 100;
      return {
        x: product.costPrice || 0,
        y: product.sellingPrice || 0,
        z: this.chartType === 'bubble' ? Math.abs(margin) * 0.5 : undefined,
        margin: margin,
        name: product.title || 'Unknown Product',
        color: this.getPointColor({ margin })
      };
    });
  }

  /**
   * Get the color for a data point based on its margin
   */
  private getPointColor(point: { margin?: number } | null): string {
    if (!point) return '#7cb5ec'; // Default color
    
    // Use margin to determine color (red for negative, green for positive)
    const margin = point.margin || 0;
    if (margin < 0) return '#ff5c5c'; // Red for negative margin
    if (margin > 20) return '#50b432'; // Dark green for high margin
    return '#7cb5ec'; // Default blue
  }

  /**
   * Set up WebSocket connection for real-time updates
   */
  private setupWebSocket(): void {
    this.webSocketService.getPriceUpdates()
      .pipe(
        filter(update => update !== null && update.genreId === this.selectedGenreId),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          // When we get a price update for the current genre, refresh the chart data
          this.loadChartData();
        },
        error: (error: Error) => {
          console.error('WebSocket error:', error);
          this.showError('Connection to real-time updates lost. Please refresh the page.');
        }
      });
  }

  /**
   * Get the tooltip formatter for Highcharts
   */
  private getTooltipFormatter(): Highcharts.TooltipFormatterCallbackFunction {
    const component = this; // Capture the component context
    
    // Create a type-safe formatter function
    const formatter: Highcharts.TooltipFormatterCallbackFunction = function() {
      try {
        // 'this' is bound to the Highcharts point context
        const point = (this as any).point as CustomPoint;
        
        // Safely extract values with defaults
        const pointX = typeof point?.x === 'number' ? point.x : 0;
        const pointY = typeof point?.y === 'number' ? point.y : 0;
        const pointName = point?.name || 'Product';
        
        // Handle both direct margin and custom.margin with proper null checks
        const marginValue = typeof point?.margin === 'number' 
          ? point.margin 
          : (point?.custom && typeof point.custom.margin === 'number' 
              ? point.custom.margin 
              : 0);
        
        // Format values with error handling
        const formatValue = (value: unknown): string => {
          try {
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toFixed(2);
            }
            return '0.00';
          } catch {
            return '0.00';
          }
        };
        
        const x = formatValue(pointX);
        const y = formatValue(pointY);
        const margin = formatValue(marginValue);
        
        // Build tooltip HTML safely
        return [
          '<div style="padding: 8px; min-width: 200px">',
          '<b>', component.escapeHtml(String(pointName)), '</b><br>',
          '<hr style="margin: 4px 0">',
          'Cost: ₹', x, '<br>',
          'Selling: ₹', y, '<br>',
          'Margin: ', margin, '%',
          '</div>'
        ].join('');
      } catch (error) {
        console.error('Error in tooltip formatter:', error);
        return '<div>Error loading tooltip</div>';
      }
    };
    
    return formatter;
  }
  
  // Helper method to safely escape HTML in tooltips
  private escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Show an error message to the user
   * @param message The error message to display
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Show a success message to the user
   * @param message The success message to display
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Update the chart with new data
   */
  private updateChart(): void {
    if (!this.chart) {
      this.initializeChart();
      return;
    }

    const seriesData = this.getChartData();
    
    this.chart.update({
      series: [{
        type: this.chartType,
        data: seriesData,
        name: 'Products',
        tooltip: {
          useHTML: true,
          formatter: this.getTooltipFormatter()
        }
      }]
    } as Highcharts.Options, true, true);
  }
}
