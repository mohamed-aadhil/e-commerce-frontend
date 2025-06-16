import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Cart } from '../../services/cart.service';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink,
    CurrencyPipe
  ],
  template: `
    <mat-card class="cart-sidebar">
      <mat-card-header>
        <mat-card-title>Shopping Cart</mat-card-title>
      </mat-card-header>
      <mat-divider></mat-divider>
      
      <mat-card-content>
        <ng-container *ngIf="(cart$ | async)?.items?.length; else emptyCart">
          <div class="cart-items">
            <div *ngFor="let item of (cart$ | async)?.items" class="cart-item">
              <img 
                [src]="item.product.images?.[0] || 'assets/images/placeholder.jpg'" 
                [alt]="item.product.title" 
                class="item-image"
              >
              <div class="item-details">
                <h4>{{ item.product.title }}</h4>
                <p>{{ item.price | currency:'INR' }} × {{ item.quantity }}</p>
                <div class="item-actions">
                  <button mat-icon-button (click)="updateQuantity(item.product.id, item.quantity - 1)">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span>{{ item.quantity }}</span>
                  <button mat-icon-button (click)="updateQuantity(item.product.id, item.quantity + 1)"
                          [disabled]="item.quantity >= item.product.inventory.quantity">
                    <mat-icon>add</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="removeItem(item.product.id)" class="remove-btn">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="cart-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ getCartValue() | currency:'INR' }}</span>
            </div>
            <button mat-raised-button color="primary" class="checkout-btn" [routerLink]="['/customer/checkout']">
              Proceed to Checkout
            </button>
          </div>
        </ng-container>
        
        <ng-template #emptyCart>
          <div class="empty-cart">
            <mat-icon>remove_shopping_cart</mat-icon>
            <p>Your cart is empty</p>
            <button mat-button color="primary" [routerLink]="['/products']">Continue Shopping</button>
          </div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .cart-sidebar {
      width: 350px;
      max-width: 100%;
    }
    .cart-items {
      max-height: 400px;
      overflow-y: auto;
      margin: 0 -16px;
      padding: 0 16px;
    }
    .cart-item {
      display: flex;
      padding: 16px 0;
      border-bottom: 1px solid #eee;
    }
    .item-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      margin-right: 16px;
      border-radius: 4px;
    }
    .item-details {
      flex: 1;
    }
    .item-details h4 {
      margin: 0 0 8px;
      font-size: 14px;
    }
    .item-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    .item-actions button {
      width: 24px;
      height: 24px;
      line-height: 24px;
    }
    .remove-btn {
      margin-left: auto;
    }
    .cart-summary {
      padding: 16px 0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 500;
    }
    .checkout-btn {
      width: 100%;
    }
    .empty-cart {
      text-align: center;
      padding: 32px 0;
    }
    .empty-cart mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.54);
    }
  `]
})
export class CartSidebarComponent {
  private cartService = inject(CartService);
  
  cart$ = this.cartService.cart$;

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateItem(productId, quantity).subscribe();
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId).subscribe();
  }

  getCartValue(): number {
    return this.cartService.getCartValue();
  }

}
