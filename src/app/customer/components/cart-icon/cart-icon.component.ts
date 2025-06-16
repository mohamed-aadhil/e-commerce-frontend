import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    AsyncPipe
  ],
  template: `
    <div class="relative">
      <button 
        mat-icon-button 
        [routerLink]="['/cart']"
        [attr.aria-label]="'Cart (' + (itemCount$ | async) + ' items)'"
        class="text-gray-700 hover:text-primary transition-colors"
      >
        <mat-icon class="text-2xl">shopping_cart</mat-icon>
      </button>
      <ng-container *ngIf="(itemCount$ | async) as count">
        <span 
          *ngIf="count > 0"
          class="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm"
        >
          {{ count > 99 ? '99+' : count }}
        </span>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    button {
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }
    
    button:hover {
      transform: scale(1.1);
      background-color: rgba(0, 0, 0, 0.04);
      border-radius: 50%;
    }
    
    button:active {
      transform: scale(0.95);
    }
  `]
})
export class CartIconComponent {
  private cartService = inject(CartService);
  
  // Expose the itemCount$ observable from the cart service
  itemCount$ = this.cartService.itemCount$;
}
