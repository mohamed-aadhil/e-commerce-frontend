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
} 