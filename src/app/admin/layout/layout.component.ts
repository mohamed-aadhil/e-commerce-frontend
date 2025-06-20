import { Component, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { AdminSidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    AdminSidebarComponent,
    HeaderComponent
  ],
  template: `
    <div class="admin-layout">
      <!-- Header -->
      <admin-header (menuToggle)="sidenav.toggle()"></admin-header>
      
      <mat-sidenav-container class="sidenav-container">
        <!-- Sidebar -->
        <mat-sidenav #sidenav mode="side" opened class="sidenav">
          <div class="sidenav-header">
            <h2>BookHub Admin</h2>
          </div>
          <admin-sidebar></admin-sidebar>
        </mat-sidenav>
        
        <!-- Main content -->
        <mat-sidenav-content>
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .sidenav-container {
      flex: 1;
      height: calc(100vh - 64px);
    }
    
    .sidenav {
      width: 250px;
      box-shadow: 3px 0 6px rgba(0,0,0,.12);
      border-right: none;
    }
    
    .sidenav-header {
      padding: 16px;
      border-bottom: 1px solid rgba(0,0,0,.12);
      text-align: center;
      background-color: #f5f5f5;
      
      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
        color: #333;
      }
    }
    
    .content-wrapper {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background-color: #fafafa;
    }
    
    @media (max-width: 959px) {
      .sidenav {
        width: 280px;
      }
      
      .content-wrapper {
        padding: 16px;
      }
    }
  `]
})
export class AdminLayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
}