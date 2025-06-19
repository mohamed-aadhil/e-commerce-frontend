import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoginComponent } from '../../../auth/login/login.component';
import { SignupComponent } from '../../../auth/signup/signup.component';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CartService, Cart, CartItem } from '../../services/cart.service';

import { AuthService } from '../../../auth/auth.service';
import { Observable, Subscription, throwError } from 'rxjs';
import { take, catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LoginComponent,
    SignupComponent,
    RouterModule
  ],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
  providers: [Location]
})
export class CartPageComponent implements OnInit, OnDestroy {
  cart$: Observable<Cart | null>;
  isUpdating = false;
  isCheckingOut = false;
  cart: Cart | null = null;
  showLoginModal = false;
  showSignupModal = false;
  private cartSubscription: Subscription | null = null;
  private returnUrl: string | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.cart$ = this.cartService.cart$;
  }

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
    if (!this.cart?.items?.length) return 0;
    return this.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Handle checkout process
   */
  async onCheckout(): Promise<void> {
    // Check if user is authenticated
    const isAuthenticated = await this.authService.isAuthenticated();
    if (!isAuthenticated) {
      this.openLoginDialog();
      return;
    }

    const cart = await this.cart$.pipe(take(1)).toPromise();
    if (!cart?.items?.length) {
      this.snackBar.open('Your cart is empty', 'Close', { duration: 3000 });
      return;
    }

    // Check product availability
    const unavailableItems = cart.items.filter(
      item => !item.product.inventory || item.quantity > item.product.inventory.quantity
    );

    if (unavailableItems.length > 0) {
      const productNames = unavailableItems
        .map(item => item.product.title)
        .join(', ');
      
      this.snackBar.open(
        `The following items are no longer available in the requested quantity: ${productNames}`,
        'OK',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      return;
    }

    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }

  // Placeholder for future order placement implementation
  private async placeOrder(): Promise<void> {
    // This method will be implemented in the new checkout flow
    throw new Error('Order placement has been disabled for the new checkout flow');
  }

  private handleError(error: { message?: string }): void {
    console.error('Cart error:', error);
    this.snackBar.open(
      error.message || 'An error occurred while loading your cart',
      'Close',
      { duration: 5000, panelClass: ['error-snackbar'] }
    );
  }

  /**
   * Open login dialog for unauthenticated users
   */
  // showLoginModal is already declared in the class properties

  private openLoginDialog(): void {
    // Set redirect URL for after login
    this.authService.redirectUrl = '/cart';
    this.showLoginModal = true;
  }

  onLoginModalClose(): void {
    this.showLoginModal = false;
  }

  onSwitchToSignup(): void {
    this.showLoginModal = false;
    this.showSignupModal = true;
  }

  onSignupModalClose(reason?: 'close' | 'switch'): void {
    this.showSignupModal = false;
    if (reason === 'switch') {
      this.showLoginModal = true;
    }
  }

  onSwitchToLogin(): void {
    this.showSignupModal = false;
    this.showLoginModal = true;
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

  private updateCartItemQuantity(item: CartItem, quantity: number): void {
    if (item.quantity === quantity) return;

    this.isUpdating = true;
    this.cartService
      .updateItem(item.product.id, quantity)
      .pipe(
        catchError((error: { message?: string }) => {
          this.handleError(error);
          return throwError(() => error);
        }),
        finalize(() => (this.isUpdating = false))
      )
      .subscribe();
  }

  private removeCartItem(productId: number): void {
    this.isUpdating = true;
    this.cartService
      .removeItem(productId)
      .pipe(
        catchError((error: { message?: string }) => {
          this.handleError(error);
          return throwError(() => error);
        }),
        finalize(() => (this.isUpdating = false))
      )
      .subscribe();
  }

  updateQuantity(productId: number, quantity: number): void {
    const item = this.cart?.items.find(item => item.product.id === productId);
    if (item) {
      this.updateCartItemQuantity(item, quantity);
    }
  }

  removeItem(productId: number): void {
    const item = this.cart?.items.find(item => item.product.id === productId);
    if (item) {
      this.removeCartItem(item.product.id);
    }
  }

}
