import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @Output() searchFocus = new EventEmitter<boolean>();
  
  searchQuery: string = '';
  isSearching = false;
  searchResults: any[] = [];
  showResults = false;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.setupResultsSubscription();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(100), // Reduced debounce time for better responsiveness
      distinctUntilChanged(),
      tap(() => this.showResults = true),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query && query.trim().length >= 2) {
        this.searchService.search(query);
      } else {
        this.searchResults = [];
        this.searchService.clearSearch();
      }
    });
  }

  private setupResultsSubscription(): void {
    this.searchService.getSearchResults()
      .pipe(takeUntil(this.destroy$))
      .subscribe((results: any[]) => {
        this.searchResults = results || [];
      });

    // Subscribe to loading state if the method exists
    const isLoading$ = (this.searchService as any).getIsLoading?.();
    if (isLoading$ && isLoading$ instanceof Observable) {
      (isLoading$ as Observable<boolean>)
        .pipe(takeUntil(this.destroy$))
        .subscribe((isLoading: boolean) => {
          this.isSearching = isLoading;
        });
    }
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onResultClick(result: any, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (result && result.id) {
      this.router.navigate(['/product', result.id]);
      this.clearSearch();
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchService.clearSearch();
    this.searchResults = [];
    this.showResults = false;
  }

  onFocus(): void {
    this.showResults = true;
    this.searchFocus.emit(true);
  }

  onBlur(): void {
    // Small delay to allow click events on results
    setTimeout(() => {
      this.showResults = false;
      this.searchFocus.emit(false);
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
