import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CartItem } from '../../../models/cart.model';

export interface OrderSummaryData {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax?: number;
  total: number;
}

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, MatIconModule],
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.css']
})
export class OrderSummaryComponent {
  @Input() orderData!: OrderSummaryData;
  @Input() showTitle = true;
  @Input() showItems = true;
  @Input() showActions = false;

  get itemsCount(): number {
    return this.orderData?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  }

  getItemTotal(item: CartItem): number {
    return (item.price || 0) * (item.quantity || 0);
  }
}
