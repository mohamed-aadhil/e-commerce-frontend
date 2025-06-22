import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'admin-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar color="primary" class="admin-toolbar px-4">
      <!-- Logo/Brand -->
      <a routerLink="/admin" class="flex items-center">
        <span class="text-xl font-bold mr-8">BookHub Admin</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="flex-1 flex items-center ml-8">
        <div class="flex space-x-1">
          <a routerLink="/admin/analytics" 
             [routerLinkActive]="['bg-white/20', 'font-semibold']"
             [routerLinkActiveOptions]="{exact: true}"
             class="px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-white/10">
            Analytics
          </a>
          <a routerLink="/admin/inventory" 
             [routerLinkActive]="['bg-white/20', 'font-semibold']"
             [routerLinkActiveOptions]="{exact: true}"
             class="px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-white/10">
            Inventory
          </a>
        </div>
      </nav>

      <!-- Right-aligned items -->
      <div class="flex items-center space-x-4">
        <!-- Notifications -->
        <button mat-icon-button class="text-white" [matMenuTriggerFor]="notificationsMenu">
          <mat-icon [matBadge]="3" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
        </button>

        <!-- User menu -->
        <button mat-button [matMenuTriggerFor]="userMenu" class="text-white">
          <div class="flex items-center">
            <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-2">
              <mat-icon class="!w-5 !h-5 !text-base">account_circle</mat-icon>
            </div>
            <span class="text-sm font-medium">
              {{ (userName$ | async) || 'Admin' }}
            </span>
            <mat-icon class="!w-5 !h-5 !text-base ml-1">arrow_drop_down</mat-icon>
          </div>
        </button>
      </div>
    </mat-toolbar>

    <!-- User menu -->
    <mat-menu #userMenu="matMenu" class="user-menu">
      <div class="user-menu-header">
        <div class="user-avatar large">
          <mat-icon>account_circle</mat-icon>
        </div>
        <div class="user-details">
          <div class="user-name">
            @if (userName$ | async; as userName) {
              {{ userName }}
            } @else {
              Admin User
            }
          </div>
          <div class="user-email">
            @if (userEmail$ | async; as userEmail) {
              {{ userEmail }}
            } @else {
              admin&#64;bookhub.com
            }
          </div>
        </div>
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="navigateTo('profile')">
        <mat-icon>person</mat-icon>
        <span>My Profile</span>
      </button>
      <button mat-menu-item (click)="navigateTo('settings')">
        <mat-icon>settings</mat-icon>
        <span>Settings</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Logout</span>
      </button>
    </mat-menu>

    <!-- Notifications Menu -->
    <mat-menu #notificationsMenu="matMenu" class="notifications-menu">
      <div class="menu-header">
        <h3>Notifications</h3>
        <button mat-button color="primary">Mark all as read</button>
      </div>
      <mat-divider></mat-divider>
      <div class="notification-item">
        <mat-icon>inventory</mat-icon>
        <div class="notification-content">
          <div class="notification-title">New Order Received</div>
          <div class="notification-time">2 minutes ago</div>
        </div>
      </div>
      <mat-divider></mat-divider>
      <div class="notification-item">
        <mat-icon>inventory</mat-icon>
        <div class="notification-content">
          <div class="notification-title">Low Stock Alert</div>
          <div class="notification-time">1 hour ago</div>
        </div>
      </div>
      <mat-divider></mat-divider>
      <div class="notification-actions">
        <button mat-button color="primary">View All Notifications</button>
      </div>
    </mat-menu>

    <!-- Mobile menu -->
    <div class="md:hidden bg-gray-800 px-4 py-2" *ngIf="isMobileMenuOpen">
      <div class="flex flex-col space-y-2">
        <a routerLink="/admin/analytics" 
           (click)="isMobileMenuOpen = false"
           class="px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md">
          Analytics
        </a>
        <a routerLink="/admin/inventory" 
           (click)="isMobileMenuOpen = false"
           class="px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md">
          Inventory
        </a>
      </div>
    </div>
  `,
  styles: [`
    /* Notification button styles */
    .notification-button {
      margin: 0 8px;
      color: #ffffff; /* Pure white for better visibility */
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
      background-color: rgba(255, 255, 255, 0.1);
    }

    .notification-button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .notification-button mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      line-height: 1;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }

    .notification-button .mat-badge-content {
      top: 4px !important;
      right: 4px !important;
      font-size: 10px;
      font-weight: 600;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }

    /* Notifications menu */
    .notifications-menu {
      width: 320px;
      max-width: 90vw;
      padding: 0;
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
    }

    .menu-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .notification-item mat-icon {
      margin-right: 12px;
      color: #666;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 0.75rem;
      color: #666;
    }

    .notification-actions {
      text-align: center;
      padding: 8px 0;
    }

    .admin-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0 1.5rem;
      height: 64px;
      display: flex;
      align-items: center;
    }
    
    /* Notification and User Menu */
    .notification-button {
      color: white;
      margin-right: 8px;
    }
    
    .user-button {
      color: white;
      height: 40px;
      padding: 0 8px;
      border-radius: 20px;
      transition: background-color 0.2s;
    }
    
    .user-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
    }
    
    /* Responsive adjustments */
    @media (max-width: 767px) {
      .admin-toolbar {
        padding: 0 0.5rem;
      }
    }
`]
})
export class HeaderComponent implements OnInit {
  isMobileMenuOpen = false;
  private authService = inject(AuthService);
  private router = inject(Router);
  
  userName$ = this.authService.user$.pipe(
    map(user => user?.['name'] || 'Admin')
  );
  
  userEmail$ = this.authService.user$.pipe(
    map((user: any) => user?.email || 'admin@bookhub.com')
  );

  constructor() {}

  ngOnInit() {}

  navigateTo(route: string) {
    // Implement navigation logic
    console.log('Navigate to:', route);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still navigate to home even if there's an error
        this.router.navigate(['/']);
      }
    });
  }
}
