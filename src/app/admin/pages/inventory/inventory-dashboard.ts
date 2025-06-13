import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { InventoryService, InventoryStats, InventoryBook } from '../../services/inventory.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { RestockDialog, RestockDialogData } from '../../components/restock-dialog/restock-dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'admin-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatSnackBarModule, MatPaginatorModule],
  templateUrl: './inventory-dashboard.html',
  styleUrl: './inventory-dashboard.css'
})
export class InventoryDashboard implements OnInit, OnDestroy {
  stats: InventoryStats | null = null;
  books: InventoryBook[] = [];
  loadingStats = true;
  loadingBooks = true;
  errorStats = false;
  errorBooks = false;
  errorMsgStats: string | null = null;
  errorMsgBooks: string | null = null;
  searchTerm: string = '';
  private userSub: Subscription | null = null;
  length = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];
  pageIndex = 0;
  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.userSub = this.authService.user$.subscribe(user => {
      if (user) {
        this.fetchStats();
        this.fetchBooks();
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
  }

  fetchStats() {
    this.loadingStats = true;
    this.errorStats = false;
    this.errorMsgStats = null;
    this.inventoryService.getStats().subscribe({
      next: (stats) => {
        console.log('Stats response:', stats);
        this.stats = stats || null;
        this.loadingStats = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorStats = true;
        this.errorMsgStats = err?.error?.error || 'Failed to load stats.';
        this.loadingStats = false;
        this.cdr.markForCheck();
      },
      complete: () => {
        this.loadingStats = false;
        this.cdr.markForCheck();
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.fetchBooks();
  }
  
  fetchBooks() {
    this.loadingBooks = true;
    this.errorBooks = false;
    this.errorMsgBooks = null;
    
    this.inventoryService.getBooks(
      this.pageIndex + 1,  // +1 because Material uses 0-based index, our API uses 1-based
      this.pageSize,
      this.searchTerm
    ).subscribe({
      next: (response) => {
        if (!response || !response.data) {
          this.books = [];
          this.length = 0;
          this.errorBooks = true;
          this.errorMsgBooks = 'No data received from server';
        } else {
          this.books = response.data || [];
          this.length = response.pagination?.total || 0;
        }
        this.loadingBooks = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorBooks = true;
        this.errorMsgBooks = err?.error?.error || 'Failed to load books.';
        this.loadingBooks = false;
        this.books = []; // Clear books on error
        this.length = 0; // Reset length on error
        this.cdr.markForCheck();
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.length / this.pageSize);
  }

  get filteredBooks(): InventoryBook[] {
    if (!this.searchTerm) return this.books;
    const searchTerm = this.searchTerm.toLowerCase();
    return this.books.filter(book => {
      const productIdStr = book.productId.toString();
      const title = book.name.toLowerCase();
      return productIdStr.includes(searchTerm) || title.includes(searchTerm);
    });
  }

  onView(book: InventoryBook) {
    alert('View: ' + book.productId);
  }

  onEdit(book: InventoryBook) {
    this.router.navigate(['/admin/books/edit', book.productId]);
  }

  onRestock(book: InventoryBook) {
    const dialogRef = this.dialog.open(RestockDialog, {
      data: {
        productId: book.productId,
        name: book.name,
        stock: book.stock
      } as RestockDialogData,
      width: '350px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.quantity) {
        this.inventoryService.restockBook(book.productId, result.quantity, result.note).subscribe({
          next: () => {
            this.snackBar.open('Book restocked successfully!', 'Close', { duration: 2000 });
            this.fetchBooks();
          },
          error: (err) => {
            const msg = err?.error?.error || 'Failed to restock book.';
            this.snackBar.open(msg, 'Close', { duration: 2000 });
          }
        });
      }
    });
  }

  onDelete(book: InventoryBook) {
    if (confirm(`Are you sure you want to delete "${book.name}"?`)) {
      this.inventoryService.deleteBook(book.productId).subscribe({
        next: () => {
          this.snackBar.open('Book deleted successfully!', 'Close', { duration: 2000 });
          this.fetchBooks();
        },
        error: (err) => {
          const msg = err?.error?.error || 'Failed to delete book.';
          this.snackBar.open(msg, 'Close', { duration: 2000 });
        }
      });
    }
  }
} 