import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-inventory-analytics',
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
    // Add chart components here later
  ],
  templateUrl: './inventory-analytics.component.html'
})
export class InventoryAnalyticsComponent implements OnInit, OnDestroy {
  // Component properties
  isLoading = false;
  isConnected = true;
  isRefreshing = false;
  lastUpdated = new Date();
  timeRange = '30d';
  
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
    // Data loading will be handled by child components
    this.isLoading = false;
  }

  async refreshData(): Promise<void> {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    const snackBarRef = this.snackBar.open('Refreshing inventory data...', undefined, {
      duration: 0
    });
    
    try {
      // Add refresh logic for child components here
      this.lastUpdated = new Date();
      
      snackBarRef.dismiss();
      this.snackBar.open('Inventory data refreshed successfully', 'Dismiss', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Error refreshing inventory data:', error);
      this.snackBar.open('Failed to refresh inventory data', 'Dismiss', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
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
