import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../services/cart.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-to-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="add-to-cart">
      <div class="quantity-selector">
        <button 
          mat-icon-button 
          (click)="decreaseQuantity()" 
          [disabled]="quantity <= 1 || isAdding || disabled"
          class="quantity-btn"
          aria-label="Decrease quantity"
        >
          <mat-icon class="text-sm">remove</mat-icon>
        </button>
        <input 
          type="number" 
          [(ngModel)]="quantity" 
          [min]="1" 
          [max]="maxQuantity"
          [disabled]="isAdding || disabled"
          (change)="validateQuantity()"
          class="quantity-input"
          aria-label="Quantity"
        >
        <button 
          mat-icon-button 
          (click)="increaseQuantity()" 
          [disabled]="quantity >= maxQuantity || isAdding || disabled"
          class="quantity-btn"
          aria-label="Increase quantity"
        >
          <mat-icon class="text-sm">add</mat-icon>
        </button>
      </div>
      <button 
        mat-flat-button 
        color="primary" 
        (click)="addToCart()"
        [disabled]="isAdding || !productId || maxQuantity === 0 || disabled"
        class="add-btn"
        [class.opacity-50]="isAdding || !productId || maxQuantity === 0 || disabled"
      >
        <mat-spinner *ngIf="isAdding" diameter="16" strokeWidth="3" class="spinner"></mat-spinner>
        <span class="text-sm font-medium">{{ buttonText }}</span>
      </button>
    </div>
  `,
  styles: [`
    .add-to-cart {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
      background-color: #f9fafb;
      height: 40px;
    }

    .quantity-btn {
      width: 32px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4b5563;
      background-color: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quantity-btn:hover:not(:disabled) {
      background-color: #f3f4f6;
      color: #1f2937;
    }

    .quantity-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .quantity-input {
      width: 36px;
      height: 100%;
      text-align: center;
      border: none;
      background: white;
      font-size: 0.875rem;
      font-weight: 500;
      color: #111827;
      -moz-appearance: textfield;
      padding: 0;
      margin: 0;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
    }

    .quantity-input:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }

    .quantity-input::-webkit-outer-spin-button,
    .quantity-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .add-btn {
      flex: 1;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 6px;
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.025em;
      transition: all 0.2s ease;
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 0 16px;
      font-size: 0.875rem;
    }

    .add-btn:not(:disabled):hover {
      background-color: #2563eb;
      transform: translateY(-1px);
    }

    .add-btn:disabled {
      background-color: #93c5fd;
      cursor: not-allowed;
      transform: none;
    }

    .add-btn .spinner {
      display: inline-block;
      margin-right: 6px;
    }
    button[mat-icon-button] {
      width: 40px;
      height: 40px;
    }
  `]
})
export class AddToCartComponent {
  @Input() productId!: number;
  @Input() maxQuantity: number = 10;
  @Input() buttonText: string = 'Add to Cart';
  @Input() disabled: boolean = false;
  
  quantity: number = 1;
  isAdding: boolean = false;
  
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);

  increaseQuantity(): void {
    if (this.quantity < this.maxQuantity) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  validateQuantity(): void {
    if (this.quantity < 1) {
      this.quantity = 1;
    } else if (this.quantity > this.maxQuantity) {
      this.quantity = this.maxQuantity;
    }
  }

  addToCart(): void {
    if (!this.productId || this.isAdding) {
      console.log('Add to cart: Missing productId or already adding', { 
        productId: this.productId, 
        isAdding: this.isAdding 
      });
      return;
    }
    
    console.log('Adding to cart:', { 
      productId: this.productId, 
      quantity: this.quantity 
    });
    
    this.isAdding = true;
    
    this.cartService.addItem(this.productId, this.quantity).subscribe({
      next: (response) => {
        console.log('Add to cart success:', response);
        this.snackBar.open(
          response.message || 'Item added to cart', 
          'Dismiss', 
          {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          }
        );
      },
      error: (error) => {
        console.error('Error adding to cart:', {
          error,
          productId: this.productId,
          quantity: this.quantity,
          errorDetails: error?.error,
          status: error?.status,
          statusText: error?.statusText
        });
        
        this.snackBar.open(
          error?.message || 'Failed to add item to cart', 
          'Dismiss', 
          {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      },
      complete: () => {
        console.log('Add to cart completed');
        this.isAdding = false;
      }
    });
  }

}
