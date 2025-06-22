import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    MatTabsModule,
    MatIconModule
  ],
  template: `
    <div class="px-4 py-2 border-b border-gray-200 bg-white">
      <nav class="flex space-x-4">
        <a 
          routerLink="products" 
          routerLinkActive="text-indigo-600 border-b-2 border-indigo-500"
          class="px-3 py-2 text-sm font-medium hover:text-gray-700"
          [routerLinkActiveOptions]="{exact: true}">
          <mat-icon class="align-middle mr-1" [class.text-indigo-500]="isActive('products')">analytics</mat-icon>
          Product Analytics
        </a>
        <a 
          routerLink="inventory" 
          routerLinkActive="text-indigo-600 border-b-2 border-indigo-500"
          class="px-3 py-2 text-sm font-medium hover:text-gray-700"
          [routerLinkActiveOptions]="{exact: true}">
          <mat-icon class="align-middle mr-1" [class.text-indigo-500]="isActive('inventory')">inventory_2</mat-icon>
          Inventory Analytics
        </a>
      </nav>
    </div>
    
    <div class="flex-1 overflow-auto">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `]
})
export class AnalyticsComponent {
  isActive(route: string): boolean {
    return window.location.pathname.endsWith(route);
  }
}
