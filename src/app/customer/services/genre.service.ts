import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Genre {
  id: number;
  name: string;
}

export interface ProductCard {
  id: number;
  name: string;
  author: string | null;
  image: string | null;
  price: number;
  status: string;
}

export interface ProductDetails {
  id: number;
  name: string;
  author: string | null;
  images: string[];
  description: string | null;
  price: number;
  stock: number;
  status: string;
  metadata: any;
}

@Injectable({ providedIn: 'root' })
export class GenreService {
  constructor(private http: HttpClient) {}

  getGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>('/api/v1/genres').pipe(
      catchError(() => of([])) // fallback to empty array
    );
  }

  getProductsForGenre(genreId: number): Observable<ProductCard[]> {
    return this.http.get<ProductCard[]>(`/api/v1/genres/${genreId}/products`).pipe(
      catchError(() => of([])) // fallback to empty array
    );
  }

  getProductDetails(productId: number): Observable<ProductDetails | null> {
    return this.http.get<ProductDetails>(`/api/v1/products/${productId}`).pipe(
      catchError(() => of(null))
    );
  }
} 