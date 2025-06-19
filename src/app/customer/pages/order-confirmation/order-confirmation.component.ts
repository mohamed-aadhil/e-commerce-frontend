import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { CheckoutService } from '../../services/checkout.service';
import { OrderSummaryComponent, OrderSummaryData } from '../../components/checkout/order-summary/order-summary.component';

// Import the OrderResponse type from the checkout service
import { OrderResponse } from '../../services/checkout.service';

// Define local interfaces that extend the service types
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    OrderSummaryComponent
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  orderId: string | null = null;
  order: OrderResponse | null = null;
  isLoading = true;
  error: string | null = null;
  
  // Order summary data
  orderSummary: OrderSummaryData = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0
  };
  
  // Shipping method options
  shippingMethods = [
    { id: 'standard', name: 'Standard Shipping', price: 4.99, estimatedDays: '3-5 business days' },
    { id: 'express', name: 'Express Shipping', price: 9.99, estimatedDays: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 19.99, estimatedDays: '1 business day' }
  ];
  
  // Payment method options
  paymentMethods = [
    { id: 'credit_card', name: 'Credit Card' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'bank_transfer', name: 'Bank Transfer' }
  ];
  
  // Selected values
  selectedPaymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'wallet' = 'credit_card';
  selectedShippingMethod: 'standard' | 'express' | 'overnight' = 'standard';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private checkoutService: CheckoutService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    
    if (this.orderId) {
      this.loadOrderDetails(this.orderId);
    } else {
      this.error = 'No order ID provided';
      this.isLoading = false;
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadOrderDetails(orderId: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.checkoutService.getOrder(parseInt(orderId, 10))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.order = order;
          this.updateOrderSummary(order);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading order:', err);
          this.error = err.error?.message || 'Failed to load order details. Please try again later.';
          this.isLoading = false;
          
          // For demo purposes, fall back to mock data if the API fails
          console.warn('Falling back to mock data');
          this.order = this.getMockOrder(orderId);
          this.updateOrderSummary(this.order);
        }
      });
  }
  
  private updateOrderSummary(order: OrderResponse): void {
    // Calculate subtotal from items if available, otherwise use total - shipping
    const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 
                    (order.total - (order.shipping?.shipping_cost || 0));
    
      // Create order items that match the expected structure for OrderSummaryComponent
    const orderItems = (order.items || []).map(item => ({
      id: item.id,
      product_id: item.product_id, // Add product_id to match CartItem interface
      name: item.product_name || `Product ${item.product_id}`,
      price: item.price,
      quantity: item.quantity,
      image_url: 'image_url' in item ? (item as any).image_url : 'https://via.placeholder.com/60',
      // Add the full product object as expected by CartItem
      product: {
        id: item.product_id,
        title: item.product_name || `Product ${item.product_id}`,
        selling_price: item.price,
        price: item.price,
        description: '',
        name: item.product_name || `Product ${item.product_id}`,
        image_url: 'image_url' in item ? (item as any).image_url : 'https://via.placeholder.com/60',
        images: 'image_url' in item ? [(item as any).image_url] : null,
        inventory: { quantity: item.quantity },
        category: { id: 0, name: 'Uncategorized' }, // Default category
        category_id: 0, // Default category ID
        stock_quantity: item.quantity, // Use item quantity as stock quantity
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    
    this.orderSummary = {
      items: orderItems,
      subtotal,
      shipping: order.shipping?.shipping_cost || 0,
      tax: 0, // Add tax if available from the backend
      total: order.total
    };
  }
  
  private getMockOrder(orderId: string): OrderResponse {
    // This is just for demonstration purposes
    const orderItems = [
      {
        id: 1,
        product_id: 101,
        product_name: 'Sample Product 1',
        quantity: 2,
        price: 49.99,
        image_url: 'https://via.placeholder.com/60'
      },
      {
        id: 2,
        product_id: 102,
        product_name: 'Sample Product 2',
        quantity: 1,
        price: 29.99,
        image_url: 'https://via.placeholder.com/60'
      }
    ];
    
    const shipping = {
      id: 1,
      shipping_method: 'standard',
      shipping_cost: 9.99,
      tracking_number: null,
      shipping_status: 'pending',
      recipient_name: 'John Doe',
      address_line1: '123 Main St',
      address_line2: 'Apt 101',
      city: 'Anytown',
      state: 'CA',
      postal_code: '12345',
      country: 'USA',
      phone: '123-456-7890'
    };
    
    const payment = {
      id: 1,
      payment_method: 'credit_card',
      payment_status: 'completed',
      amount: 129.97,
      transaction_id: 'txn_' + Math.random().toString(36).substr(2, 10)
    };
    
    return {
      id: parseInt(orderId, 10) || 1,
      status: 'processing',
      total: 129.97,
      payment_status: 'completed',
      shipping_status: 'pending',
      created_at: new Date().toISOString(),
      items: orderItems,
      shipping,
      payment
    };
  }
  
  onContinueShopping(): void {
    this.router.navigate(['/']);
  }
  
  onViewOrderHistory(): void {
    this.router.navigate(['/account/orders']);
  }
  
  onTrackOrder(): void {
    if (this.orderId) {
      this.router.navigate(['/track-order', this.orderId]);
    }
  }
  
  onPrintReceipt(): void {
    window.print();
  }
  
  getOrderStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }
  
  getPaymentStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'completed': 'Completed',
      'failed': 'Failed',
      'refunded': 'Refunded'
    };
    return statusMap[status] || status;
  }
  
  getShippingStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }
  
  // Get shipping method details by ID
  getShippingMethodDetails(methodId: string): { name: string; estimatedDays: string } {
    const method = this.shippingMethods.find(m => m.id === methodId);
    return method || { 
      name: methodId ? `${methodId.charAt(0).toUpperCase()}${methodId.slice(1)} Shipping` : 'Standard Shipping', 
      estimatedDays: '3-5 business days' 
    };
  }
  
  // Get payment method name by ID
  getPaymentMethodName(methodId: string): string {
    const method = this.paymentMethods.find(m => m.id === methodId);
    if (method) return method.name;
    
    // Fallback for common payment method IDs
    const methodNames: { [key: string]: string } = {
      'credit_card': 'Credit Card',
      'debit_card': 'Debit Card',
      'paypal': 'PayPal',
      'bank_transfer': 'Bank Transfer',
      'wallet': 'Wallet'
    };
    
    return methodNames[methodId] || methodId || 'Credit Card';
  }
  
  getEstimatedDeliveryDate(): string {
    if (!this.order?.created_at) return '';
    
    const created = new Date(this.order.created_at);
    const estimatedDelivery = new Date(created);
    
    // Add days based on shipping method
    const shippingMethod = this.order.shipping?.shipping_method || 'standard';
    const daysToAdd = shippingMethod === 'overnight' ? 1 : shippingMethod === 'express' ? 2 : 3;
    estimatedDelivery.setDate(created.getDate() + daysToAdd);
    
    // Skip weekends
    while (estimatedDelivery.getDay() === 0 || estimatedDelivery.getDay() === 6) {
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
    }
    
    return estimatedDelivery.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
