import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Audience {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAudienceService {
  constructor(private http: HttpClient) {}

  getAudiences(): Observable<Audience[]> {
    return this.http.get<Audience[]>('/api/v1/audiences').pipe(
      catchError(() => of([]))
    );
  }

  addAudience(name: string): Observable<Audience | null> {
    return this.http.post<Audience>('/api/v1/audiences', { name }).pipe(
      catchError(() => of(null))
    );
  }
} 