import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Category {
  id: number;
  name: string;
  type: 'genre' | 'audience';
}

export interface Genre extends Category {
  type: 'genre';
}

export interface Audience extends Category {
  type: 'audience';
}

export interface ProductCard {
  id: number;
  name: string;
  author: string | null;
  images: string[] | null;
  selling_price: number;
  status: string;
  inventory: {
    quantity: number;
  };
}

export interface ProductDetails {
  id: number;
  name: string;
  author: string | null;
  images: string[];
  description: string | null;
  selling_price: number;
  stock: number;
  status: string;
  metadata: any;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly baseUrl = '/api/v1';

  constructor(private http: HttpClient) {}

  // Genre methods
  getGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>(`${this.baseUrl}/genres`).pipe(
      map((genres: any[]) => genres.map((genre: any) => ({ ...genre, type: 'genre' as const }))),
      catchError(() => of([]))
    );
  }

  getProductsForGenre(genreId: number): Observable<ProductCard[]> {
    return this.http.get<ProductCard[]>(`${this.baseUrl}/genres/${genreId}/products`).pipe(
      catchError(() => of([]))
    );
  }

  // Audience methods
  getAudiences(): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences`).pipe(
      map((audiences: any[]) => audiences.map((audience: any) => ({ ...audience, type: 'audience' as const }))),
      catchError(() => of([]))
    );
  }

  getProductsForAudience(audienceId: number): Observable<ProductCard[]> {
    return this.http.get<ProductCard[]>(`${this.baseUrl}/audiences/${audienceId}/products`).pipe(
      catchError(() => of([]))
    );
  }

  // Common methods
  getProducts(page: number = 1, limit: number = 10, filters: any = {}): Observable<{ products: ProductCard[], total: number }> {
    let url = `${this.baseUrl}/products?page=${page}&limit=${limit}`;

    // Add filters to the URL if provided
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          url += `&${key}=${encodeURIComponent(filters[key])}`;
        }
      });
    }

    return this.http.get<{ products: any[], total: number }>(url).pipe(
      map(response => ({
        products: response.products.map(product => ({
          ...product,
          inventory: {
            quantity: product.inventory?.quantity || 0
          }
        } as ProductCard)),
        total: response.total
      })),
      catchError(error => {
        console.error('Error fetching products:', error);
        return of({ products: [], total: 0 });
      })
    );
  }

  getProductDetails(productId: number): Observable<ProductDetails | null> {
    return this.http.get<ProductDetails>(`${this.baseUrl}/products/${productId}`).pipe(
      catchError(() => of(null))
    );
  }
}
