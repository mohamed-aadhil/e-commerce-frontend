import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalyticsService, GenreStats } from '../../services/analytics.service';
import { WebSocketService, GenreDataUpdate } from '../../services/websocket.service';
import { GenreDistributionChartComponent } from '../../components/analytics/genre-distribution-chart/genre-distribution-chart.component';

@Component({
  selector: 'app-product-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    GenreDistributionChartComponent
  ],
  template: `
    <div class="container">
      <mat-card class="mb-4">
        <mat-card-header>
          <mat-card-title>Product Analytics</mat-card-title>
          <mat-card-subtitle>Real-time analytics and insights about your product catalog.</mat-card-subtitle>
        </mat-card-header>
      </mat-card>
      
      <div class="row">
        <!-- Genre Distribution Chart -->
        <div class="col-12 col-lg-8">
          <app-genre-distribution-chart></app-genre-distribution-chart>
        </div>
        
        <!-- Stats Overview -->
        <div class="col-12 col-lg-4">
          <div class="row">
            <div class="col-12 mb-4">
              <mat-card class="h-100">
                <mat-card-header>
                  <mat-card-title>Quick Stats</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="stats" class="stats-grid">
                    <div class="stat-item">
                      <div class="stat-label">Total Products</div>
                      <div class="stat-value">{{ stats.totalBooks | number }}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">Total Genres</div>
                      <div class="stat-value">{{ stats.totalGenres | number }}</div>
                    </div>
                    <div class="stat-item" *ngIf="stats.mostPopularGenre">
                      <div class="stat-label">Most Popular Genre</div>
                      <div class="stat-value">
                        {{ stats.mostPopularGenre.name }}
                        <small class="text-muted">({{ stats.mostPopularGenre.bookCount | number }} books)</small>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="!stats" class="flex justify-center p-4">
                    <mat-spinner [diameter]="40"></mat-spinner>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
            
            <!-- Connection Status -->
            <div class="col-12">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Connection Status</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="flex items-center">
                    <mat-icon [color]="isConnected ? 'primary' : 'warn'" class="mr-2">
                      {{ isConnected ? 'check_circle' : 'error' }}
                    </mat-icon>
                    <span>
                      {{ isConnected ? 'Connected to real-time updates' : 'Disconnected' }}
                    </span>
                  </div>
                  <p class="text-sm text-muted mt-2">
                    Real-time updates are {{ isConnected ? 'enabled' : 'disabled' }}.
                    <button 
                      *ngIf="!isConnected" 
                      mat-button 
                      color="primary" 
                      class="ml-2"
                      (click)="reconnect()">
                      Reconnect
                    </button>
                  </p>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add more charts and analytics components here -->
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1rem;
    }
    
    .container {
      width: 100%;
      padding-right: 15px;
      padding-left: 15px;
      margin-right: auto;
      margin-left: auto;
    }
    
    .row {
      display: flex;
      flex-wrap: wrap;
      margin-right: -15px;
      margin-left: -15px;
    }
    
    .col-12 {
      flex: 0 0 100%;
      max-width: 100%;
      padding-right: 15px;
      padding-left: 15px;
    }
    
    .col-lg-8 {
      flex: 0 0 66.666667%;
      max-width: 66.666667%;
    }
    
    .col-lg-4 {
      flex: 0 0 33.333333%;
      max-width: 33.333333%;
    }
    
    .mb-4 {
      margin-bottom: 1.5rem !important;
    }
    
    .ml-2 {
      margin-left: 0.5rem !important;
    }
    
    .mr-2 {
      margin-right: 0.5rem !important;
    }
    
    .mt-2 {
      margin-top: 0.5rem !important;
    }
    
    .p-4 {
      padding: 1.5rem !important;
    }
    
    .flex {
      display: flex;
    }
    
    .items-center {
      align-items: center;
    }
    
    .justify-center {
      justify-content: center;
    }
    
    .h-100 {
      height: 100%;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    
    .stat-item {
      padding: 1rem 0;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .stat-item:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.25rem;
    }
    
    .stat-value {
      font-size: 1.25rem;
      font-weight: 500;
    }
    
    .text-muted {
      color: #6c757d;
    }
    
    .text-sm {
      font-size: 0.875rem;
    }
    
    @media (max-width: 991.98px) {
      .col-lg-4, .col-lg-8 {
        flex: 0 0 100%;
        max-width: 100%;
      }
      
      .col-12:not(:last-child) {
        margin-bottom: 1.5rem;
      }
    }
  `],
})
export class ProductAnalyticsComponent implements OnInit, OnDestroy {
  stats: GenreStats | null = null;
  isLoading = false;
  isConnected = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private analyticsService: AnalyticsService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setupWebSocket();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupWebSocket(): void {
    // Initial connection status
    this.isConnected = this.webSocketService.isConnected();
    
    // Listen for connection status changes
    this.webSocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isConnected: boolean) => {
        // Use setTimeout to defer the update to the next change detection cycle
        setTimeout(() => {
          this.isConnected = isConnected;
          if (isConnected) {
            this.loadStats(); // Refresh data on reconnect
            this.showSuccess('Connected to real-time updates');
          } else {
            this.showError('Disconnected from real-time updates. Attempting to reconnect...');
          }
          // Manually trigger change detection
          this.cdr.detectChanges();
        });
      });
      
    // Listen for genre updates
    this.webSocketService.genreUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe((update: GenreDataUpdate | null) => {
        if (update?.genreDistribution) {
          // Update the stats with the new genre distribution
          this.stats = {
            ...(this.stats || {
              totalBooks: 0,
              totalGenres: 0,
              mostPopularGenre: null
            }),
            totalBooks: update.stats.totalBooks,
            totalGenres: update.stats.totalGenres,
            mostPopularGenre: update.stats.mostPopularGenre
          };
          this.cdr.detectChanges();
        }
      });
  }

  private loadStats(): void {
    this.isLoading = true;
    this.error = null;
    
    this.analyticsService.getGenreStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load genre stats:', err);
        this.error = 'Failed to load analytics data. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async reconnect(): Promise<void> {
    this.isLoading = true;
    try {
      await this.webSocketService.reconnect();
      this.showSuccess('Successfully reconnected to real-time updates');
    } catch (error) {
      console.error('Failed to reconnect:', error);
      this.showError('Failed to reconnect. Please try again later.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
