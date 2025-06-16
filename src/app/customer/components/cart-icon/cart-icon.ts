import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule, 
    MatButtonModule, 
    MatIconModule,
    RouterLink,
    AsyncPipe
  ],
  template: `
    <button 
      mat-icon-button 
      [matBadge]="itemCount$ | async" 
      matBadgeColor="warn"
      [matBadgeHidden]="(itemCount$ | async) === 0"
      [routerLink]="cartLink"
      [queryParams]="cartQueryParams"
      aria-label="Shopping cart"
    >
      <mat-icon>shopping_cart</mat-icon>
    </button>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CartIconComponent {
  private cartService = inject(CartService);
  private router = inject(Router);
  
  itemCount$ = this.cartService.itemCount$;
  
  // Get the current URL for the cart link
  get cartLink() {
    return ['/cart'];
  }

  // Get query parameters for the cart link
  get cartQueryParams() {
    // Get the current URL without query params
    const currentUrl = this.router.url.split('?')[0];
    
    // If we're already on the cart page, don't include a return URL
    if (currentUrl === '/cart') {
      return {};
    }
    
    // Otherwise, include the current URL as returnUrl
    return { returnUrl: currentUrl };
  }
}
