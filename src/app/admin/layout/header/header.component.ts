import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { map } from 'rxjs';

@Component({
  selector: 'admin-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar color="primary" class="admin-toolbar">
      <!-- Toggle sidebar button (visible on mobile) -->
      <button mat-icon-button (click)="toggleSidebar()" class="sidebar-toggle">
        <mat-icon class="material-icons">menu</mat-icon>
      </button>

      <!-- Page title -->
      <span class="title">{{ pageTitle }}</span>

      <span class="spacer"></span>

      <!-- Notifications -->
      <button mat-icon-button class="notification-button" [matMenuTriggerFor]="notificationsMenu">
        <mat-icon class="material-icons" [matBadge]="3" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
      </button>

      <!-- User menu -->
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
        <div class="user-avatar">
          <mat-icon class="material-icons">account_circle</mat-icon>
        </div>
        <div class="user-info">
          <div class="user-name">
            @if (userName$ | async; as userName) {
              {{ userName }}
            } @else {
              Admin
            }
          </div>
          <div class="user-role">Administrator</div>
        </div>
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
    </mat-toolbar>

    <!-- User menu -->
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

    <!-- User Menu -->
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
      padding: 0 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      height: 64px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .title {
      margin-left: 16px;
      font-weight: 500;
      font-size: 1.2rem;
    }

    .user-button {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 12px 0 8px;
      margin: 0;
      border-radius: 20px;
      text-transform: none;
      line-height: normal;
      min-width: auto;
      transition: background-color 0.2s;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .user-button:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    .user-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #1976d2; /* Primary blue background */
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .user-avatar mat-icon {
      color: #ffffff; /* White icon on blue background */
      font-size: 24px;
      width: 24px;
      height: 24px;
      line-height: 1;
    }

    .user-avatar.large {
      width: 64px;
      height: 64px;
      margin: 0 0 16px 0;
      background-color: #1976d2; /* Primary blue background */
    }

    .user-avatar.large mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #ffffff; /* White icon on blue background */
    }

    .user-avatar mat-icon {
      color: white;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-right: 8px;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.2;
      color: white;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .user-role {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.2;
    }

    .user-email {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.2;
    }

    /* User menu styles */
    .user-menu {
      width: 280px;
      padding: 16px 0;
    }

    .user-menu-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 16px 24px;
      text-align: center;
    }

    .user-details {
      margin-top: 12px;
      text-align: center;
    }

    .user-menu .mat-menu-item {
      height: 40px;
      line-height: 40px;
    }

    .user-menu .mat-icon {
      margin-right: 16px;
    }

    /* Responsive styles */
    @media (max-width: 599px) {
      .user-role, .user-email {
        display: none;
      }
      
      .user-button {
        padding: 0 8px;
      }
      
      .user-avatar {
        width: 32px;
        height: 32px;
        margin-right: 8px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();
  pageTitle = 'Dashboard';
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // User data observables
  userName$ = this.authService.user$.pipe(
    map(user => user?.['name'] || 'Admin')
  );
  
  userEmail$ = this.authService.user$.pipe(
    map((user: any) => user?.email || 'admin@bookhub.com')
  );

  constructor() {}

  ngOnInit() {
    // Initialize component
  }

  toggleSidebar() {
    this.menuToggle.emit();
  }

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
