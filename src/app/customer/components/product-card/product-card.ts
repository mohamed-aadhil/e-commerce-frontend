import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductCard as ProductCardModel } from '../../services/product.service';
import { AddToCartComponent } from '../add-to-cart/add-to-cart';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule, 
    AddToCartComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  @Input() product!: ProductCardModel;

  constructor(
    private router: Router
  ) {}

  get stockStatus() {
    return this.product.inventory?.quantity > 0 ? 'In Stock' : 'Out of Stock';
  }
  
  get isOutOfStock() {
    return !this.product.inventory || this.product.inventory.quantity <= 0;
  }

  onCardClick(event: MouseEvent) {
    // Prevent navigation if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    this.router.navigate(['/product', this.product.id]);
  }
}
