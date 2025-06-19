import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CheckoutRequest {
  addressId: number;
  shippingMethod?: 'standard' | 'express' | 'overnight';
  paymentMethod?: 'credit_card' | 'debit_card' | 'paypal' | 'wallet';
  items?: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface OrderResponse {
  id: number;
  status: string;
  total: number;
  payment_status: string;
  shipping_status: string;
  created_at: string;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  shipping: {
    id: number;
    shipping_method: string;
    shipping_cost: number;
    tracking_number: string | null;
    shipping_status: string;
    recipient_name?: string;
    address_line1?: string;
    address_line2?: string | null;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
  };
  payment: {
    id: number;
    payment_method: string;
    payment_status: string;
    amount: number;
    transaction_id: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private apiUrl = `${environment.apiUrl}/api/v1`;

  constructor(private http: HttpClient) {}

  // Create a new order from cart
  checkoutFromCart(checkoutData: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${this.apiUrl}/cart/checkout`,
      checkoutData
    );
  }

  // Create a new direct order (buy now)
  createDirectOrder(checkoutData: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${this.apiUrl}/orders`,
      checkoutData
    );
  }

  // Get order by ID
  getOrder(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/${orderId}`);
  }

  // Process payment for an order
  processPayment(orderId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/payments/${orderId}/process`,
      {}
    );
  }

  // Get shipping methods
  getShippingMethods(): Array<{id: string, name: string, price: number, estimatedDays: string}> {
    // In a real app, this would come from the backend
    return [
      { id: 'standard', name: 'Standard Shipping', price: 4.99, estimatedDays: '3-5 business days' },
      { id: 'express', name: 'Express Shipping', price: 9.99, estimatedDays: '1-2 business days' },
      { id: 'overnight', name: 'Overnight Shipping', price: 19.99, estimatedDays: 'Next business day' },
    ];
  }

  // Get payment methods
  getPaymentMethods(): Array<{id: string, name: string, icon: string}> {
    // In a real app, this would come from the backend
    return [
      { id: 'credit_card', name: 'Credit Card', icon: 'credit_card' },
      { id: 'debit_card', name: 'Debit Card', icon: 'credit_card' },
      { id: 'paypal', name: 'PayPal', icon: 'paypal' },
      { id: 'wallet', name: 'Wallet', icon: 'account_balance_wallet' },
    ];
  }
}
