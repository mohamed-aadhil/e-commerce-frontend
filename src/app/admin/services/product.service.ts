import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id?: string;
  title: string;
  author: string;
  selling_price: number;
  cost_price: number;
  description?: string;
  product_type: string;
  images: string[];
  genre_ids: number[];
  audience_ids: number[];
  initial_stock?: number;
  metadata?: { [key: string]: any };
  genres?: Array<{ id: number; name: string }>;
  audiences?: Array<{ id: number; name: string }>;
  inventory?: { quantity: number };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = '/api/v1/products';

  constructor(private http: HttpClient) {}

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getProducts(params?: any): Observable<{ data: Product[]; total: number }> {
    return this.http.get<{ data: Product[]; total: number }>(this.apiUrl, { params });
  }

  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Backward compatibility aliases
  getBookById = this.getProduct.bind(this);
  updateBook = this.updateProduct.bind(this);
}