import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  price: number;
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

  getBooks(): Observable<InventoryBook[]> {
    return this.http.get<InventoryBook[]>('/api/v1/inventory/books', {
      headers: { 'Cache-Control': 'no-cache' }
    });
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