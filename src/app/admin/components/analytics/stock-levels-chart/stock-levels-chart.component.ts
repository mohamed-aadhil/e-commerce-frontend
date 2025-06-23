import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnalyticsService } from '../../../services/analytics.service';
import { StockLevelData, StockLevelStats, Genre } from '../../../models/analytics.model';
import { Subject, takeUntil, finalize, catchError, of } from 'rxjs';
import * as echarts from 'echarts';

type ChartType = 'bar' | 'pie' | 'line';

interface ChartTypeOption {
  label: string;
  value: ChartType;
  icon: string;
}

@Component({
  selector: 'app-stock-levels-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './stock-levels-chart.component.html',
  styleUrls: ['./stock-levels-chart.component.css']
})
export class StockLevelsChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') private chartContainer!: ElementRef<HTMLDivElement>;
  @ViewChild(MatMenuTrigger) genreMenuTrigger!: MatMenuTrigger;
  
  // Chart instance
  private chart: echarts.ECharts | null = null;
  private destroy$ = new Subject<void>();
  
  // Data and state
  isLoading = false;
  error: string | null = null;
  lastUpdated = new Date();
  chartData: StockLevelData | null = null;
  genres: Genre[] = [];
  selectedGenreId: number | null = null;
  
  // Chart configuration
  chartType: ChartType = 'bar';
  chartTypeOptions: ChartTypeOption[] = [
    { label: 'Bar', value: 'bar', icon: 'bar_chart' },
    { label: 'Pie', value: 'pie', icon: 'pie_chart' },
    { label: 'Line', value: 'line', icon: 'show_chart' }
  ];
  
  // Colors for chart
  private readonly COLORS = {
    inStock: '#10B981',    // green-500
    lowStock: '#F59E0B',   // amber-500
    outOfStock: '#EF4444'  // red-500
  };

  constructor(
    private analyticsService: AnalyticsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  private isViewInitialized = false;
  private isDataLoaded = false;

  private resizeListener: (() => void) | null = null;

  ngOnInit(): void {
    // Bind the resize handler to the component instance
    this.resizeListener = this.onResize.bind(this);
    window.addEventListener('resize', this.resizeListener);
    
    this.loadGenres();
    this.setupWebSocket();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.initializeChartIfReady();
  }

  private loadData(): void {
    this.loadChartData()
      .then(() => {
        this.isDataLoaded = true;
        this.initializeChartIfReady();
      })
      .catch(error => {
        console.error('Error loading chart data:', error);
        this.showError('Failed to load chart data');
      });
  }

  ngOnDestroy(): void {
    // Remove resize event listener if it exists
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
    
    this.destroyChart();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Public method to refresh the chart data
  async refresh(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      await this.loadChartData();
      this.snackBar.open('Stock levels refreshed', 'Dismiss', { duration: 2000 });
    } catch (error) {
      console.error('Error refreshing stock levels:', error);
      this.showError('Failed to refresh stock levels');
    } finally {
      this.isLoading = false;
    }
  }

  // Load available genres
  private loadGenres(): void {
    this.analyticsService.getGenres()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (genres) => {
          this.genres = genres;
          if (genres.length > 0 && !this.selectedGenreId) {
            this.selectedGenreId = null; // Default to all genres
          }
        },
        error: (error) => {
          console.error('Error loading genres:', error);
          this.showError('Failed to load genres');
        }
      });
  }

  // Load chart data from the API
  public loadChartData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.analyticsService.getStockLevels(this.selectedGenreId || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            // Ensure we have valid data structure
            if (!data || !data.stats) {
              console.warn('Invalid chart data received:', data);
              this.chartData = {
                stats: {
                  inStockCount: 0,
                  lowStockCount: 0,
                  outOfStockCount: 0,
                  totalProducts: 0,
                  totalStock: 0
                },
                products: []
              };
            } else {
              this.chartData = data;
            }
            this.lastUpdated = new Date();
            
            // Force update the view before resolving
            this.cdr.detectChanges();
            resolve();
          },
          error: (err) => {
            console.error('Error loading stock levels:', err);
            this.showError('Failed to load stock levels');
            reject(err);
          }
        });
    });
  }

  // Set up WebSocket for real-time updates
  private setupWebSocket(): void {
    this.analyticsService.subscribeToStockLevelUpdates(
      this.selectedGenreId,
      (data) => {
        this.chartData = data;
        this.lastUpdated = new Date();
        this.updateChart();
      }
    );
  }

  private initializeChartIfReady(): void {
    if (!this.isViewInitialized || !this.isDataLoaded) {
      return;
    }
    
    // Ensure the view is updated
    this.cdr.detectChanges();
    
    // Double check the container exists
    if (!this.chartContainer?.nativeElement) {
      console.warn('Chart container still not available, will retry...');
      setTimeout(() => this.initializeChartIfReady(), 100);
      return;
    }
    
    this.initializeChart();
  }

  // Initialize the chart
  private initializeChart(): void {
    if (!this.chartContainer?.nativeElement) {
      console.warn('Chart container not ready');
      return;
    }

    const container = this.chartContainer.nativeElement;

    // Ensure container is visible and has dimensions
    container.style.display = 'block';
    container.style.width = '100%';
    container.style.height = '400px';
    
    // Dispose existing chart if it exists
    this.destroyChart();
    
    try {
      // Initialize chart with default options
      this.chart = echarts.init(container);
      
      // Set initial empty options
      this.chart.setOption({
        title: {
          text: 'Loading...',
          left: 'center',
          top: 'center'
        },
        grid: {
          containLabel: true
        },
        tooltip: {},
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: []
      });
      
      // Update with actual data
      this.updateChart();
      
      // Trigger a resize after a small delay to ensure proper rendering
      setTimeout(() => {
        if (this.chart) {
          this.onResize();
        }
      }, 100);
      
    } catch (error) {
      console.error('Error initializing chart:', error);
      this.showError('Failed to initialize chart');
    }
  }

  // Update chart with current data
  private updateChart(): void {
    if (!this.chart) {
      this.initializeChartIfReady();
      return;
    }

    if (!this.chartData) {
      console.warn('No chart data available');
      return;
    }
    
    // Ensure we have valid data before proceeding
    const { stats } = this.chartData;
    if (!stats || (stats.inStockCount === 0 && stats.lowStockCount === 0 && stats.outOfStockCount === 0)) {
      this.chart.setOption({
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center',
          textStyle: {
            fontSize: 16,
            color: '#666'
          }
        },
        series: []
      }, true);
      return;
    }
    
    try {
      // Get new chart options
      const option = this.getChartOption();
      
      // First clear any existing chart data
      this.chart.clear();
      
      // Set the new options with notMerge: true to clear existing series
      this.chart.setOption(option, {
        notMerge: true,
        lazyUpdate: false,
        silent: false
      });
      
      // Force a resize to ensure proper rendering
      setTimeout(() => {
        if (this.chart) {
          try {
            this.chart.resize({
              animation: {
                duration: 300
              }
            });
          } catch (resizeError) {
            console.warn('Error resizing chart:', resizeError);
          }
        }
      }, 50);
    } catch (error) {
      console.error('Error updating chart:', error);
      // Try to reinitialize the chart if there's an error
      setTimeout(() => {
        this.destroyChart();
        this.initializeChartIfReady();
      }, 100);
    }
  }

  // Get chart options based on selected chart type
  private getChartOption(): echarts.EChartsOption {
    if (!this.chartData) {
      return {};
    }
    
    const { stats } = this.chartData;
    const chartType = this.chartType;
    
    const commonOptions: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const { name, value, color } = params;
          return `
            <div class="p-2">
              <div class="font-medium text-gray-800">${name}</div>
              <div class="flex items-center mt-1">
                <span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${color};"></span>
                <span>${value} items</span>
              </div>
            </div>
          `;
        }
      },
      legend: {
        show: chartType !== 'pie',
        bottom: 10,
        data: ['In Stock', 'Low Stock', 'Out of Stock']
      },
      series: []
    };
    
    // Define series data with consistent names that match the legend
    const seriesData = [
      { 
        name: 'In Stock', 
        value: stats.inStockCount, 
        itemStyle: { color: this.COLORS.inStock },
        label: { show: true, position: 'top' }
      },
      { 
        name: 'Low Stock', 
        value: stats.lowStockCount, 
        itemStyle: { color: this.COLORS.lowStock },
        label: { show: true, position: 'top' }
      },
      { 
        name: 'Out of Stock', 
        value: stats.outOfStockCount, 
        itemStyle: { color: this.COLORS.outOfStock },
        label: { show: true, position: 'top' }
      }
    ];
    
    switch (chartType) {
      case 'pie':
        return {
          ...commonOptions,
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}: {c} ({d}%)',
              position: 'inside' as const
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '14',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true
            },
            data: seriesData.map(item => ({
              name: item.name,
              value: item.value,
              itemStyle: { color: item.itemStyle?.color }
            }))
          }]
        };
        
      case 'line':
        return {
          ...commonOptions,
          xAxis: {
            type: 'category',
            data: ['In Stock', 'Low Stock', 'Out of Stock'],
            axisLine: { show: true },
            axisTick: { show: true },
            axisLabel: { rotate: 0 }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: true },
            splitLine: {
              lineStyle: {
                type: 'dashed'
              }
            }
          },
          series: [{
            data: seriesData.map(item => ({
              value: item.value,
              itemStyle: { color: item.itemStyle.color }
            })),
            type: 'line',
            smooth: true,
            symbolSize: 10,
            lineStyle: {
              width: 3,
              color: this.COLORS.inStock
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
              ])
            }
          }]
        };
        
      case 'bar':
      default:
        return {
          ...commonOptions,
          xAxis: {
            type: 'category',
            data: ['In Stock', 'Low Stock', 'Out of Stock'],
            axisLine: { show: true },
            axisTick: { show: true },
            axisLabel: { rotate: 0 }
          },
          yAxis: {
            type: 'value',
            axisLine: { show: true },
            axisTick: { show: true },
            splitLine: {
              lineStyle: {
                type: 'dashed'
              }
            }
          },
          series: [{
            data: seriesData.map(item => ({
              value: item.value,
              itemStyle: { 
                color: item.itemStyle.color,
                borderRadius: [4, 4, 0, 0]
              }
            })),
            type: 'bar',
            barWidth: '40%',
            showBackground: true,
            backgroundStyle: {
              color: 'rgba(180, 180, 180, 0.1)',
              borderRadius: [4, 4, 0, 0]
            },
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => params.value
            }
          }]
        };
    }
  }

  // Handle chart type change
  changeChartType(type: ChartType): void {
    if (this.chartType !== type) {
      this.chartType = type;
      this.updateChart();
    }
  }

  // Handle genre selection change
  onGenreChange(genreId: number | null): void {
    // Don't do anything if the genre hasn't changed
    if (this.selectedGenreId === genreId) {
      return;
    }
    
    this.selectedGenreId = genreId;
    this.isLoading = true;
    this.error = null;
    
    // Close the menu first
    if (this.genreMenuTrigger) {
      this.genreMenuTrigger.closeMenu();
    }
    
    // Clear existing chart data
    if (this.chart) {
      this.chart.clear();
      this.chart.setOption({
        title: {
          text: 'Loading...',
          left: 'center',
          top: 'center',
          textStyle: {
            fontSize: 16,
            color: '#666'
          }
        }
      }, true);
    }
    
    // Load new data and update chart
    this.loadChartData()
      .then(() => {
        if (this.chart) {
          // Force a complete re-render of the chart
          this.chart.dispose();
          this.chart = null;
          this.initializeChartIfReady();
        } else {
          this.initializeChartIfReady();
        }
      })
      .catch(error => {
        console.error('Error loading chart data:', error);
        this.showError('Failed to load chart data');
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  // Clean up chart resources
  private destroyChart(): void {
    if (this.chart) {
      window.removeEventListener('resize', this.onResize);
      this.chart.dispose();
      this.chart = null;
    }
  }

  // Handle window resize with proper binding
  public onResize(): void {
    if (this.chart && this.chartContainer?.nativeElement) {
      const container = this.chartContainer.nativeElement;
      this.chart.resize({
        width: container.offsetWidth,
        height: 400
      });
    }
  }

  // Show error message
  private showError(message: string): void {
    this.error = message;
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Get the selected genre name
  get selectedGenreName(): string {
    if (!this.selectedGenreId) return 'All Genres';
    const genre = this.genres.find(g => g.id === this.selectedGenreId);
    return genre ? genre.name : 'All Genres';
  }
}
