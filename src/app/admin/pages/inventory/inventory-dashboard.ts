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

@Component({
  selector: 'admin-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatSnackBarModule],
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

  fetchBooks() {
    this.loadingBooks = true;
    this.errorBooks = false;
    this.errorMsgBooks = null;
    this.inventoryService.getBooks().subscribe({
      next: (books) => {
        console.log('Books response:', books);
        this.books = Array.isArray(books) ? books : [];
        this.loadingBooks = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorBooks = true;
        this.errorMsgBooks = err?.error?.error || 'Failed to load books.';
        this.loadingBooks = false;
        this.cdr.markForCheck();
      },
      complete: () => {
        this.loadingBooks = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredBooks(): InventoryBook[] {
    if (!this.searchTerm) return this.books;
    return this.books.filter(book =>
      book.productId.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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