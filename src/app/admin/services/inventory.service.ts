import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InventoryStats {
  totalBooks: number;
  lowStockItems: number;
  totalValue: number;
  outOfStock: number;
}

export interface InventoryBook {
  productId: string;
  name: string;
  author: string | null;
  genres: string[];
  cost_price: number;
  selling_price: number;
  stock: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<InventoryStats> {
    return this.http.get<InventoryStats>('/api/v1/inventory/stats', {
      headers: { 'Cache-Control': 'no-cache' }
    });
  }

  getBooks(page: number = 1, limit: number = 10, search: string = ''): Observable<PaginatedResponse<InventoryBook>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      // Check if search is a number (product ID) or string (title)
      params = /^\d+$/.test(search) 
        ? params.set('productId', search)
        : params.set('title', search);
    }
  
    return this.http.get<PaginatedResponse<InventoryBook>>('/api/v1/inventory/books', { 
      params,
      headers: { 'Cache-Control': 'no-cache' }
    }).pipe(
      catchError(error => {
        console.error('Error fetching books:', error);
        // Return empty response on error
        return of({
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        });
      })
    );
  }

  deleteBook(productId: string): Observable<any> {
    return this.http.delete(`/api/v1/products/${productId}`);
  }

  /**
   * Restock a book by productId.
   * @param productId The product ID to restock
   * @param quantity The quantity to add (positive integer)
   * @param note Optional note for the restock
   */
  restockBook(productId: string, quantity: number, note?: string): Observable<any> {
    return this.http.post(`/api/v1/products/${productId}/restock`, { quantity, note });
  }
} 