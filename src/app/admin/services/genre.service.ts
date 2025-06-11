import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Genre {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AdminGenreService {
  constructor(private http: HttpClient) {}

  getGenres(): Observable<Genre[]> {
    return this.http.get<Genre[]>('/api/v1/genres').pipe(
      catchError(() => of([]))
    );
  }

  addGenre(name: string): Observable<Genre | null> {
    return this.http.post<Genre>('/api/v1/genres', { name }).pipe(
      catchError(() => of(null))
    );
  }
} 