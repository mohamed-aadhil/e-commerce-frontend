import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PriceAnalysisChartComponent } from '../../components/analytics/price-analysis-chart/price-analysis-chart.component';
import { GenreDistributionChartComponent } from '../../components/analytics/genre-distribution-chart/genre-distribution-chart.component';
import { AnalyticsService } from '../../services/analytics.service';
import { WebSocketService } from '../../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    PriceAnalysisChartComponent,
    GenreDistributionChartComponent
  ],
  templateUrl: './product-analytics.component.html'
})
export class ProductAnalyticsComponent implements OnInit, OnDestroy {
  // Component properties
  isLoading = false;
  isConnected = true;
  isRefreshing = false;
  lastUpdated = new Date();
  timeRange = '30d';
  @ViewChild(GenreDistributionChartComponent) genreChart!: GenreDistributionChartComponent;
  @ViewChild(PriceAnalysisChartComponent) priceChart!: PriceAnalysisChartComponent;

  private destroy$ = new Subject<void>();

  constructor(
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    // Data loading is now handled by child components
    this.isLoading = false;
  }

  async refreshData(): Promise<void> {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    const snackBarRef = this.snackBar.open('Refreshing all chart data...', undefined, {
      duration: 0
    });
    
    try {
      const loadingTasks = [];
      
      // Refresh both charts in parallel
      if (this.genreChart) {
        loadingTasks.push(
          this.genreChart.refresh()
            .catch((err: Error) => {
              console.error('Error refreshing genre chart:', err);
              this.snackBar.open('Failed to refresh genre chart', 'Dismiss', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
              throw err;
            })
        );
      }
      
      if (this.priceChart) {
        loadingTasks.push(
          this.priceChart.refresh()
            .catch((err: Error) => {
              console.error('Error refreshing price chart:', err);
              this.snackBar.open('Failed to refresh price chart', 'Dismiss', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
              throw err;
            })
        );
      }
      
      // Wait for all refreshes to complete
      await Promise.all(loadingTasks);
      this.lastUpdated = new Date();
      
      snackBarRef.dismiss();
      this.snackBar.open('All charts refreshed successfully', 'Dismiss', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Error refreshing charts:', error);
      // You might want to show an error toast here
    } finally {
      this.isRefreshing = false;
    }
  }

  reconnect(): void {
    this.isConnected = true;
    this.loadData();
  }

  setTimeRange(range: string): void {
    this.timeRange = range;
    this.loadData();
  }
}
