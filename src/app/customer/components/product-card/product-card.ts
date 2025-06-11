import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductCard as ProductCardModel } from '../../services/genre.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  @Input() product!: ProductCardModel;

  @Output() addToCart = new EventEmitter<ProductCardModel>();
  @Output() buyNow = new EventEmitter<ProductCardModel>();

  constructor(private router: Router) {}

  onAddToCart() {
    this.addToCart.emit(this.product);
  }

  onBuyNow() {
    this.buyNow.emit(this.product);
  }

  onCardClick(event: MouseEvent) {
    // Prevent navigation if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    this.router.navigate(['/product', this.product.id]);
  }
}
