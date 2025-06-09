import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
}
