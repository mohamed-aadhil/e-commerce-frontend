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
    return this.http.get<Genre[]>('/api/genres').pipe(
      catchError(() => of([])) // fallback to empty array
    );
  }

  getProductsByGenre(genreId: number): Observable<ProductCard[]> {
    return this.http.get<ProductCard[]>(`/api/products?genre_id=${genreId}`).pipe(
      catchError(() => of([])) // fallback to empty array
    );
  }

  getProductDetails(productId: number): Observable<ProductDetails | null> {
    return this.http.get<ProductDetails>(`/api/products/${productId}`).pipe(
      catchError(() => of(null))
    );
  }
} 