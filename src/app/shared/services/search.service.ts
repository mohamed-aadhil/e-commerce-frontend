import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchSubject = new Subject<string>();
  private searchResults = new BehaviorSubject<any[]>([]);
  private isLoading = new BehaviorSubject<boolean>(false);
  private error = new BehaviorSubject<string | null>(null);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private searchDebounceTime = 150; // Reduced from 300ms to 150ms for faster response

  constructor(private http: HttpClient) {
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      filter(query => query !== null && query !== undefined),
      tap(() => this.isLoading.next(true)),
      debounceTime(this.searchDebounceTime),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          this.searchResults.next([]);
          this.isLoading.next(false);
          return of([]);
        }
        return this.performSearch(query).pipe(
          catchError(error => {
            console.error('Search error:', error);
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (results) => {
        this.searchResults.next(results);
        this.isLoading.next(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isLoading.next(false);
      }
    });
  }

  search(query: string): void {
    this.searchSubject.next(query.trim());
  }

  getSearchResults(): Observable<any[]> {
    return this.searchResults.asObservable();
  }

  private performSearch(query: string): Observable<any[]> {
    // Check if query is a valid ISBN (10 or 13 digits, with optional hyphens)
    const isbnRegex = /^(?:\d[- ]*){9}[\dXx]$|^(?:\d[- ]*){13}$/;
    const isISBN = isbnRegex.test(query);

    // Build search parameters
    let params = new HttpParams();
    if (isISBN) {
      params = params.set('isbn', query.replace(/[\s-]/g, '')); // Remove any spaces or hyphens
    } else {
      params = params.set('title', query);
    }

    // Add pagination and limit
    params = params
      .set('limit', '5') // Limit to 5 results for better performance
      .set('sort', 'relevance');

    // Make the API call with cache busting
    return this.http.get<any[]>('/api/v1/products', { 
      params,
      headers: { 'Cache-Control': 'no-cache' }
    }).pipe(
      catchError(error => {
        console.error('Search API error:', error);
        return of([]);
      })
    );
  }

  clearSearch(): void {
    this.searchResults.next([]);
  }
}
