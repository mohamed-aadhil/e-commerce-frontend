import { Component, OnInit, inject, HostListener, ElementRef } from '@angular/core';
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
    <mat-toolbar color="primary" class="px-0 py-2 sm:py-3 flex items-center justify-between flex-wrap gap-2 relative z-[100]">
      <!-- Logo/Brand -->
      <a routerLink="/admin" class="flex items-center flex-shrink-0">
        <span class="text-lg sm:text-xl font-bold max-w-[120px] truncate">BookHub Admin</span>
      </a>

      <!-- Mobile Menu Button (Hamburger) -->
      <button mat-icon-button class="md:hidden text-white order-last sm:order-none" (click)="isMobileMenuOpen = !isMobileMenuOpen" aria-label="Toggle menu">
        <mat-icon>{{ isMobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
      </button>

      <!-- Desktop Navigation -->
      <nav class="flex-1 hidden md:flex items-center ml-8">
        <div class="flex space-x-1">
          <a routerLink="/admin/analytics" 
             [routerLinkActive]="['bg-white/20', 'font-semibold']"
             [routerLinkActiveOptions]="{exact: true}"
             class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-white/10">
            Analytics
          </a>
          <a routerLink="/admin/inventory" 
             [routerLinkActive]="['bg-white/20', 'font-semibold']"
             [routerLinkActiveOptions]="{exact: true}"
             class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors hover:bg-white/10">
            Inventory
          </a>
        </div>
      </nav>

      <!-- Right-aligned items -->
      <div class="flex items-center gap-x-2 sm:gap-x-4">
        <!-- Notifications -->
        <div class="relative">
          <button mat-icon-button class="text-white" (click)="toggleNotificationsMenu()">
            <mat-icon [matBadge]="3" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
          </button>
          @if (isNotificationsMenuOpen) {
            <div class="fixed top-[64px] left-0 right-0 w-full bg-white py-1 focus:outline-none z-[9999] px-0" (click)="$event.stopPropagation()">
              <div class="px-0 py-2 border-b border-gray-100 flex flex-col items-start sm:flex-row sm:items-center sm:justify-between">
                <h3 class="font-semibold text-gray-800 text-base sm:text-lg mb-2 sm:mb-0 w-full sm:w-auto">Notifications</h3>
                <button mat-button color="primary" class="text-primary text-[0.6rem] xs:text-[0.7rem] sm:text-xs hover:underline flex-shrink-0 flex-grow-0">Mark all as read</button>
              </div>
              <div class="max-h-80 overflow-y-auto">
                <div class="flex flex-col sm:flex-row items-start sm:items-center px-0 py-2 hover:bg-gray-50">
                  <mat-icon class="text-blue-500 mr-2 flex-shrink-0 mb-2 sm:mb-0">inventory</mat-icon>
                  <div class="w-full flex-1 min-w-0">
                    <div class="font-medium text-gray-800 whitespace-normal break-words">New Order Received</div>
                    <div class="text-xs text-gray-500 whitespace-normal break-words">2 minutes ago</div>
                  </div>
                </div>
                <mat-divider></mat-divider>
                <div class="flex flex-col sm:flex-row items-start sm:items-center px-0 py-2 hover:bg-gray-50">
                  <mat-icon class="text-orange-500 mr-2 flex-shrink-0 mb-2 sm:mb-0">inventory</mat-icon>
                  <div class="w-full flex-1 min-w-0">
                    <div class="font-medium text-gray-800 whitespace-normal break-words">Low Stock Alert</div>
                    <div class="text-xs text-gray-500 whitespace-normal break-words">1 hour ago</div>
                  </div>
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="px-0 py-2 text-right">
                <button mat-button color="primary" class="text-primary text-sm hover:underline">View All Notifications</button>
              </div>
            </div>
          }
        </div>

        <!-- User menu -->
        <div class="relative">
          <button mat-button class="text-white px-2 py-1.5" (click)="toggleUserMenu()">
            <div class="flex items-center">
              <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mr-1.5">
                <mat-icon class="!w-4 !h-4 text-base">account_circle</mat-icon>
              </div>
              <span class="text-sm font-medium hidden xs:hidden sm:inline">
                {{ (userName$ | async) || 'Admin' }}
              </span>
              <mat-icon class="!w-4 !h-4 text-base ml-1">arrow_drop_down</mat-icon>
            </div>
          </button>
          @if (isUserMenuOpen) {
            <div class="fixed top-[64px] left-0 right-0 w-full md:right-0 md:w-auto bg-white py-1 focus:outline-none z-[9999] px-0" (click)="$event.stopPropagation()">
              <div class="px-0 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mr-1 sm:mr-3 mb-2 sm:mb-0">
                  <mat-icon class="!w-6 !h-6 text-gray-600">account_circle</mat-icon>
                </div>
                <div class="w-full flex-1 min-w-0">
                  <div class="font-semibold text-gray-800 whitespace-normal break-words">
                    @if (userName$ | async; as userName) {
                      {{ userName }}
                    } @else {
                      Admin User
                    }
                  </div>
                  <div class="text-xs text-gray-500 whitespace-normal break-words">
                    @if (userEmail$ | async; as userEmail) {
                      {{ userEmail }}
                    } @else {
                      admin&#64;bookhub.com
                    }
                  </div>
                </div>
              </div>
              <mat-divider></mat-divider>
              <button (click)="navigateTo('profile')" class="flex items-center px-0 py-2 text-gray-700 hover:bg-gray-100 w-full text-left">
                <mat-icon class="mr-2">person</mat-icon>
                <span>My Profile</span>
              </button>
              <button (click)="navigateTo('settings')" class="flex items-center px-0 py-2 text-gray-700 hover:bg-gray-100 w-full text-left">
                <mat-icon class="mr-2">settings</mat-icon>
                <span>Settings</span>
              </button>
              <mat-divider></mat-divider>
              <button (click)="logout()" class="flex items-center px-0 py-2 text-gray-700 hover:bg-gray-100 w-full text-left">
                <mat-icon class="mr-2">logout</mat-icon>
                <span>Logout</span>
              </button>
            </div>
          }
        </div>
      </div>
    </mat-toolbar>

    <!-- Mobile menu -->
    <div class="md:hidden bg-primary w-full py-2" *ngIf="isMobileMenuOpen">
      <div class="flex flex-col space-y-2 px-4">
        <a routerLink="/admin/analytics" 
           [routerLinkActive]="['bg-white/20', 'font-semibold']"
           [routerLinkActiveOptions]="{exact: true}"
           (click)="isMobileMenuOpen = false"
           class="px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md block w-full text-center">
          Analytics
        </a>
        <a routerLink="/admin/inventory" 
           [routerLinkActive]="['bg-white/20', 'font-semibold']"
           [routerLinkActiveOptions]="{exact: true}"
           (click)="isMobileMenuOpen = false"
           class="px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md block w-full text-center">
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

    /* Global Mat Menu Item styles to force wrap */
    ::ng-deep .mat-menu-item {
      white-space: normal !important;
      word-break: break-word !important;
      height: auto !important; /* Allow height to adjust */
      line-height: normal !important; /* Reset line-height if it's restrictive */
    }

    .admin-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
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

    ::ng-deep .mat-menu-panel {
      background-color: #fff !important;
      box-shadow: 0 4px 24px 0 rgba(0,0,0,0.12) !important;
      z-index: 9999 !important;
      min-width: 160px;
      border-radius: 0.5rem;
    }
  `]
})
export class HeaderComponent implements OnInit {
  isMobileMenuOpen = false;
  isNotificationsMenuOpen = false;
  isUserMenuOpen = false;
  private authService = inject(AuthService);
  private router = inject(Router);
  
  userName$ = this.authService.user$.pipe(
    map(user => user?.['name'] || 'Admin')
  );
  
  userEmail$ = this.authService.user$.pipe(
    map((user: any) => user?.email || 'admin@bookhub.com')
  );

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event']) onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isNotificationsMenuOpen = false;
      this.isUserMenuOpen = false;
    }
  }

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

  toggleNotificationsMenu() {
    this.isNotificationsMenuOpen = !this.isNotificationsMenuOpen;
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }
}