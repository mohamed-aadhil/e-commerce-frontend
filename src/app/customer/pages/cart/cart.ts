import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService, Cart } from '../../services/cart.service';
import { filter, map, take, Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink,
    CurrencyPipe,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartPageComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);
  
  cart$ = this.cartService.cart$;
  isUpdating = false;
  
  // Add type for cart
  cart: Cart | null = null;
  private cartSubscription: Subscription | null = null;
  private returnUrl: string | null = null;
  
  private location = inject(Location);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    
    // Subscribe to cart changes
    this.cartSubscription = this.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  continueShopping() {
    // Use the stored returnUrl or default to the home page
    const targetUrl = this.returnUrl || '/';
    console.log('Navigating to:', targetUrl);
    this.router.navigateByUrl(targetUrl).catch(error => {
      console.error('Navigation error:', error);
      // Fallback to home page if navigation fails
      this.router.navigate(['/']);
    });
  }

  getCartValue(): number {
    if (!this.cart) return 0;
    return this.cart.items.reduce((total: number, item: { price: number; quantity: number }) => total + (item.price * item.quantity), 0);
  }

  getStockStatus(quantity: number | undefined): { text: string; class: string } {
    if (quantity === undefined || quantity <= 0) {
      return { text: 'Out of Stock', class: 'out-of-stock' };
    } else if (quantity <= 10) {
      return { text: `Only ${quantity} left!`, class: 'low-stock' };
    } else {
      return { text: 'In Stock', class: 'in-stock' };
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    if (this.isUpdating) {
      console.log('CartPage: Update quantity already in progress');
      return;
    }
    
    console.log('CartPage: Updating quantity', { productId, quantity });
    this.isUpdating = true;
    
    this.cartService.updateItem(productId, quantity).subscribe({
      next: (cart) => {
        console.log('CartPage: Update quantity success', { productId, quantity, cart });
      },
      error: (error) => {
        console.error('CartPage: Error updating quantity:', {
          error,
          productId,
          quantity,
          status: error?.status,
          statusText: error?.statusText,
          errorDetails: error?.error
        });
        
        this.snackBar.open(
          error?.error?.message || 'Failed to update cart', 
          'Dismiss', 
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      },
      complete: () => {
        console.log('CartPage: Update quantity completed');
        this.isUpdating = false;
      }
    });
  }

  removeItem(productId: number): void {
    if (this.isUpdating) {
      console.log('CartPage: Remove item already in progress');
      return;
    }
    
    console.log('CartPage: Removing item', { productId });
    this.isUpdating = true;
    
    this.cartService.removeItem(productId).subscribe({
      next: (cart) => {
        console.log('CartPage: Remove item success', { productId, cart });
      },
      error: (error) => {
        console.error('CartPage: Error removing item:', {
          error,
          productId,
          status: error?.status,
          statusText: error?.statusText,
          errorDetails: error?.error
        });
        
        this.snackBar.open(
          error?.error?.message || 'Failed to remove item', 
          'Dismiss', 
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      },
      complete: () => {
        console.log('CartPage: Remove item completed');
        this.isUpdating = false;
      }
    });
  }

}
