import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, catchError, throwError, pairwise, filter } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    title: string;
    selling_price: number;
    images: string[] | null;
    inventory: { quantity: number };
  };
  quantity: number;
  price: number;
}

export interface Cart {
  id: number;
  user_id?: number;
  is_guest: boolean;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = '/api/v1/cart';
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private http = inject(HttpClient);

  // Public observables
  cart$ = this.cartSubject.asObservable();
  itemCount$ = this.cart$.pipe(
    map(cart => cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0)
  );

  private authService = inject(AuthService);

  constructor() {
    // Initial cart load
    this.loadCart();
    
    // Listen for auth state changes to refresh the cart
    this.authService.user$.subscribe(user => {
      console.log('Auth state changed, user:', user ? 'logged in' : 'logged out');
      
      // Always refresh cart when auth state changes
      // This handles both login and logout scenarios
      setTimeout(() => {
        console.log('Refreshing cart after auth state change...');
        this.loadCart();
      }, 500); // Small delay to ensure session is fully established
    });
  }

  private loadCart(): void {
    console.log('CartService.loadCart: Starting to load cart...');
    this.getCart().subscribe({
      next: (cart) => {
        console.log('CartService.loadCart: Successfully loaded cart:', cart);
      },
      error: (error) => {
        console.error('CartService.loadCart: Error loading cart:', error);
        // If there's an error, try to create a new cart
        if (error.status === 404) {
          console.log('Cart not found, creating a new cart...');
          this.http.post<ApiResponse<Cart>>(this.apiUrl, {}).subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.cartSubject.next(response.data);
              }
            },
            error: (err) => {
              console.error('Error creating new cart:', err);
            }
          });
        }
      }
    });
  }

  getCart(): Observable<Cart> {
    console.log('CartService.getCart: Fetching cart from', this.apiUrl);
    
    // Log the current time to help with debugging
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting cart fetch...`);
    
    return this.http.get<{ success: boolean; data: Cart }>(this.apiUrl).pipe(
      tap(response => {
        console.log(`[${new Date().toISOString()}] Cart fetch completed in ${Date.now() - startTime}ms`);
        console.log('CartService.getCart raw response:', response);
      }),
      map(response => {
        if (!response.success) {
          // Handle case where the API returns an error message
          const errorMessage = 'error' in response ? response.error : 'Unknown error';
          throw new Error(`Failed to fetch cart: ${errorMessage}`);
        }
        return response.data;
      }),
      tap({
        next: (cart) => {
          console.log('CartService.getCart success:', {
            cartId: cart.id,
            itemCount: cart.items?.length || 0,
            isGuest: cart.is_guest,
            userId: cart.user_id
          });
          this.cartSubject.next(cart);
        },
        error: (error) => {
          const errorInfo = {
            time: new Date().toISOString(),
            url: this.apiUrl,
            status: error?.status,
            statusText: error?.statusText,
            error: error?.error || error.message,
            stack: error?.stack
          };
          console.error('CartService.getCart error:', JSON.stringify(errorInfo, null, 2));
        }
      })
    );
  }

  addItem(productId: number, quantity: number = 1): Observable<ApiResponse<Cart>> {
    console.log('CartService.addItem:', { productId, quantity });
    
    return this.http.post<ApiResponse<Cart>>(`${this.apiUrl}/items`, { 
      productId, 
      quantity 
    }).pipe(
      tap({
        next: (response) => {
          console.log('CartService.addItem success:', response);
          if (response.success && response.data) {
            this.cartSubject.next(response.data);
          }
        },
        error: (error) => {
          console.error('CartService.addItem error:', {
            error,
            productId,
            quantity,
            url: `${this.apiUrl}/items`,
            status: error?.status,
            statusText: error?.statusText,
            errorDetails: error?.error
          });
        }
      }),
      catchError(error => {
        // Convert HTTP errors to a consistent format
        const errorMessage = error?.error?.message || 'Failed to add item to cart';
        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          error: error.error
        }));
      })
    );
  }

  updateItem(productId: number, quantity: number): Observable<Cart> {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    
    console.log('CartService.updateItem:', { productId, quantity });
    
    return this.http.put<{ success: boolean; data: Cart }>(`${this.apiUrl}/items/${productId}`, { 
      quantity 
    }).pipe(
      map(response => response.data),
      tap({
        next: (cart) => {
          console.log('CartService.updateItem success:', cart);
          this.cartSubject.next(cart);
        },
        error: (error) => {
          console.error('CartService.updateItem error:', {
            error,
            productId,
            quantity,
            url: `${this.apiUrl}/items/${productId}`,
            status: error?.status,
            statusText: error?.statusText,
            errorDetails: error?.error
          });
        }
      })
    );
  }

  removeItem(productId: number): Observable<Cart> {
    console.log('CartService.removeItem:', { productId });
    
    return this.http.delete<{ success: boolean; data: Cart }>(`${this.apiUrl}/items/${productId}`).pipe(
      map(response => response.data),
      tap({
        next: (cart) => {
          console.log('CartService.removeItem success:', cart);
          this.cartSubject.next(cart);
        },
        error: (error) => {
          console.error('CartService.removeItem error:', {
            error,
            productId,
            url: `${this.apiUrl}/items/${productId}`,
            status: error?.status,
            statusText: error?.statusText,
            errorDetails: error?.error
          });
        }
      })
    );
  }

  clearCart(): Observable<Cart> {
    console.log('CartService.clearCart');
    
    return this.http.delete<{ success: boolean; data: Cart }>(this.apiUrl).pipe(
      map(response => response.data),
      tap({
        next: (cart) => {
          console.log('CartService.clearCart success:', cart);
          this.cartSubject.next(cart);
        },
        error: (error) => {
          console.error('CartService.clearCart error:', {
            error,
            url: this.apiUrl,
            status: error?.status,
            statusText: error?.statusText,
            errorDetails: error?.error
          });
        }
      })
    );
  }

  getCartValue(): number {
    const cart = this.cartSubject.value;
    if (!cart?.items?.length) return 0;
    return cart.items.reduce(
      (total, item) => total + (item.price * item.quantity), 
      0
    );
  }
}
