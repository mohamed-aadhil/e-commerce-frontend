import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminGenreService, Genre } from '../../services/genre.service';
import { AdminAudienceService, Audience } from '../../services/audience.service';
import { ProductService } from '../../services/product.service';
// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'admin-add-book',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './add-book.component.html',
  styleUrl: './add-book.component.css'
})
export class AddBookComponent implements OnInit {
  // Form fields
  title = '';
  author = '';
  price: number | null = null;
  productType = 'New Book';
  images: string[] = [''];
  genreIds: number[] = [];
  audienceIds: number[] = [];
  initialStock: number | null = null;
  metadata: { key: string; value: string }[] = [];

  // Dropdown data
  genres: Genre[] = [];
  audiences: Audience[] = [];

  // Inline add state
  newGenreName = '';
  addingGenre = false;
  newAudienceName = '';
  addingAudience = false;

  // Loading and error states
  loadingGenres = false;
  loadingAudiences = false;
  errorGenres = false;
  errorAudiences = false;
  submitting = false;
  submitError = '';
  submitSuccess = false;

  isEditMode = false;
  productId: string | null = null;
  originalData: any = null;

  constructor(
    private genreService: AdminGenreService,
    private audienceService: AdminAudienceService,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = id;
        this.fetchBook(id);
      } else {
        this.isEditMode = false;
        this.productId = null;
        this.resetForm();
      }
    });
    this.fetchGenres();
    this.fetchAudiences();
  }

  fetchGenres() {
    this.loadingGenres = true;
    this.genreService.getGenres().subscribe({
      next: (genres) => {
        this.genres = genres;
        this.loadingGenres = false;
      },
      error: () => {
        this.errorGenres = true;
        this.loadingGenres = false;
      }
    });
  }

  fetchAudiences() {
    this.loadingAudiences = true;
    this.audienceService.getAudiences().subscribe({
      next: (audiences) => {
        this.audiences = audiences;
        this.loadingAudiences = false;
      },
      error: () => {
        this.errorAudiences = true;
        this.loadingAudiences = false;
      }
    });
  }

  fetchBook(id: string) {
    this.productService.getBookById(id).subscribe({
      next: (book: any) => {
        console.log(book);
        this.prefillForm(book);
        this.originalData = {
          ...book,
          genres: (book.genres || []).map((g: any) => ({ ...g, id: Number(g.id) })),
          audiences: (book.audiences || []).map((a: any) => ({ ...a, id: Number(a.id) })),
          images: (book.images || []).slice(),
          metadata: { ...(book.metadata || {}) }
        };
        console.log(this.originalData);
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Failed to load book data.', 'Close', { duration: 2000 });
        this.router.navigate(['/admin']);
      }
    });
  }

  prefillForm(book: any) {
    this.title = book.title;
    this.author = book.author;
    this.price = book.price;
    this.productType = book.product_type;
    this.images = book.images || [''];
    this.genreIds = (book.genres || []).map((g: any) => Number(g.id));
    this.audienceIds = (book.audiences || []).map((a: any) => Number(a.id));
    this.metadata = Object.entries(book.metadata || {}).map(([key, value]) => ({ key, value: String(value) }));
    // initialStock is not set in edit mode
  }

  resetForm() {
    this.title = '';
    this.author = '';
    this.price = null;
    this.productType = 'New Book';
    this.images = [''];
    this.genreIds = [];
    this.audienceIds = [];
    this.initialStock = null;
    this.metadata = [];
  }

  isFormChanged(): boolean {
    if (!this.isEditMode || !this.originalData) return true;
    const normalizeIds = (arr: any[]) => (arr || []).map(id => Number(id)).sort((a, b) => a - b);

    const current = {
      title: this.title,
      author: this.author,
      price: this.price,
      product_type: this.productType,
      images: this.images.filter(img => img.trim()),
      genre_ids: normalizeIds(this.genreIds),
      audience_ids: normalizeIds(this.audienceIds),
      metadata: Object.fromEntries(this.metadata.filter(m => m.key && m.value).map(m => [m.key, m.value]))
    };
    const original = {
      title: this.originalData.title,
      author: this.originalData.author,
      price: this.originalData.price,
      product_type: this.originalData.product_type,
      images: this.originalData.images || [],
      genre_ids: normalizeIds((this.originalData.genres || []).map((g: any) => g.id)),
      audience_ids: normalizeIds((this.originalData.audiences || []).map((a: any) => a.id)),
      metadata: this.originalData.metadata || {}
    };
    return JSON.stringify(current) !== JSON.stringify(original);
  }

  addGenreInline() {
    const name = this.newGenreName.trim();
    if (!name) return;
    if (this.genres.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      this.snackBar.open('Genre already exists.', 'Close', { duration: 2000 });
      return;
    }
    this.addingGenre = true;
    this.genreService.addGenre(name).subscribe({
      next: (genre) => {
        if (genre) {
          this.genres.push(genre);
          setTimeout(() => {
            this.genreIds.push(genre.id);
          });
          this.snackBar.open('Genre added successfully!', 'Close', { duration: 2000 });
          this.cdr.detectChanges();
        }
        this.newGenreName = '';
        this.addingGenre = false;
      },
      error: (err) => {
        const errorMessage = err?.error?.error || 'Failed to add genre.';
        this.snackBar.open(errorMessage, 'Close', { duration: 2000 });
        this.addingGenre = false;
      }
    });
  }

  addAudienceInline() {
    const name = this.newAudienceName.trim();
    if (!name) return;
    if (this.audiences.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      this.snackBar.open('Audience already exists.', 'Close', { duration: 2000 });
      return;
    }
    this.addingAudience = true;
    this.audienceService.addAudience(name).subscribe({
      next: (audience) => {
        if (audience) {
          this.audiences.push(audience);
          setTimeout(() => {
            this.audienceIds.push(audience.id);
          });
          this.snackBar.open('Audience added successfully!', 'Close', { duration: 2000 });
          this.cdr.detectChanges();
        }
        this.newAudienceName = '';
        this.addingAudience = false;
      },
      error: (err) => {
        const errorMessage = err?.error?.error || 'Failed to add audience.';
        this.snackBar.open(errorMessage, 'Close', { duration: 2000 });
        this.addingAudience = false;
      }
    });
  }

  addImageField() {
    this.images.push('');
  }

  removeImageField(idx: number) {
    if (this.images.length > 1) this.images.splice(idx, 1);
  }

  addMetadataField() {
    this.metadata.push({ key: '', value: '' });
  }

  removeMetadataField(idx: number) {
    this.metadata.splice(idx, 1);
  }

  buildUpdatePayload() {
    const payload: any = {};
    if (this.title !== this.originalData.title) payload.title = this.title;
    if (this.author !== this.originalData.author) payload.author = this.author;
    if (this.price !== this.originalData.price) payload.price = this.price;
    if (this.productType !== this.originalData.product_type) payload.product_type = this.productType;

    // Compare arrays by stringifying after normalizing and sorting
    const newImages = this.images.filter(img => img.trim());
    if (JSON.stringify(newImages) !== JSON.stringify(this.originalData.images || [])) {
      payload.images = newImages;
    }

    const normalizeIds = (arr: any[]) => (arr || []).map(id => Number(id)).sort((a, b) => a - b);
    const newGenreIds = normalizeIds(this.genreIds);
    const origGenreIds = normalizeIds((this.originalData.genres || []).map((g: any) => g.id));
    if (JSON.stringify(newGenreIds) !== JSON.stringify(origGenreIds)) {
      payload.genre_ids = this.genreIds;
    }

    const newAudienceIds = normalizeIds(this.audienceIds);
    const origAudienceIds = normalizeIds((this.originalData.audiences || []).map((a: any) => a.id));
    if (JSON.stringify(newAudienceIds) !== JSON.stringify(origAudienceIds)) {
      payload.audience_ids = this.audienceIds;
    }

    // Metadata
    const newMetadata = Object.fromEntries(this.metadata.filter(m => m.key && m.value).map(m => [m.key, m.value]));
    if (JSON.stringify(newMetadata) !== JSON.stringify(this.originalData.metadata || {})) {
      payload.metadata = newMetadata;
    }

    return payload;
  }

  onSubmit(form: any) {
    this.submitError = '';
    this.submitSuccess = false;
    if (!form.valid) {
      this.submitError = 'Please fill all required fields.';
      return;
    }
    if (!this.genreIds.length || !this.audienceIds.length) {
      this.submitError = 'Please select at least one genre and one audience.';
      return;
    }
    if (this.isEditMode) {
      if (!this.isFormChanged()) {
        this.submitError = 'No changes made.';
        return;
      }
      this.submitting = true;
      const payload = this.buildUpdatePayload();
      this.productService.updateBook(this.productId!, payload).subscribe({
        next: () => {
          this.snackBar.open('Book updated successfully!', 'Close', { duration: 2000 });
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.submitting = false;
          const msg = err?.error?.error || 'Failed to update book.';
          this.snackBar.open(msg, 'Close', { duration: 3000 });
        }
      });
      return;
    }
    this.submitting = true;
    // Prepare metadata object
    const metadataObj: any = {};
    for (const m of this.metadata) {
      if (m.key && m.value) metadataObj[m.key] = m.value;
    }
    // Prepare payload
    const payload = {
      title: this.title,
      author: this.author,
      price: this.price,
      product_type: this.productType,
      images: this.images.filter(img => img.trim()),
      genre_ids: this.genreIds,
      audience_ids: this.audienceIds,
      initial_stock: this.initialStock,
      metadata: metadataObj
    };
    this.http.post('/api/v1/products', payload).subscribe({
      next: () => {
        this.submitSuccess = true;
        this.onReset(form);
        setTimeout(() => this.router.navigate(['/admin']), 1200);
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.error || 'Failed to add book.';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      },
      complete: () => {
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin']);
  }

  onReset(form: any) {
    this.title = '';
    this.author = '';
    this.price = null;
    this.productType = 'New Book';
    this.images = [''];
    this.genreIds = [];
    this.audienceIds = [];
    this.initialStock = null;
    this.metadata = [];
    this.newGenreName = '';
    this.addingGenre = false;
    this.newAudienceName = '';
    this.addingAudience = false;
    this.submitError = '';
    this.submitSuccess = false;
    if (form && form.resetForm) {
      form.resetForm();
    }
  }
} 