import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
}

@Component({
  selector: 'admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    <mat-nav-list>
      <a mat-list-item routerLink="/admin/inventory" routerLinkActive="active">
        <mat-icon matListItemIcon>inventory_2</mat-icon>
        <span matListItemTitle>Inventory</span>
      </a>
      
      <mat-nav-list>
        <a mat-list-item routerLink="/admin/inventory/add" routerLinkActive="active">
          <span matListItemLine>+ Add Book</span>
        </a>
      </mat-nav-list>

      <!-- Analytics Section -->
      <mat-divider></mat-divider>
      <h3 matSubheader>Analytics</h3>
      <a mat-list-item routerLink="/admin/analytics" routerLinkActive="active">
        <mat-icon matListItemIcon>analytics</mat-icon>
        <span matListItemTitle>Product Analytics</span>
      </a>
    </mat-nav-list>
  `,
  styles: [`
    .active {
      background-color: rgba(0, 0, 0, 0.04);
      font-weight: 500;
    }
    
    mat-divider {
      margin: 8px 0;
    }
    
    mat-nav-list {
      padding-top: 0;
    }
    
    [matSubheader] {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class AdminSidebarComponent {}
