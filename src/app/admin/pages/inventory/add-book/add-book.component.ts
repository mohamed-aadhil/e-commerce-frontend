import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminGenreService, Genre } from '../../../services/genre.service';
import { AdminAudienceService, Audience } from '../../../services/audience.service';
import { ProductService } from '../../../services/product.service';
// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { NgZone } from '@angular/core';

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
  sellingPrice: number | null = null;
  costPrice: number | null = null;
  description = '';
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

  private ngZone = inject(NgZone);
  private changeDetector = inject(ChangeDetectorRef);

  constructor(
    private genreService: AdminGenreService,
    private audienceService: AdminAudienceService,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
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
    this.productService.getProduct(id).subscribe({
      next: (book) => {
        console.log('Fetched book data:', book); // Debug log
        
        // Reset arrays first to ensure clean state
        this.images = [];
        this.genreIds = [];
        this.audienceIds = [];
        this.metadata = [];

        // Set basic fields
        this.title = book.title || '';
        this.author = book.author || '';
        this.sellingPrice = book.selling_price || null;
        this.costPrice = book.cost_price || null;
        this.description = book.description || '';
        this.productType = book.product_type || 'New Book';
        
        // Handle images
        if (book.images && book.images.length > 0) {
          this.images = [...book.images];
        } else {
          this.images = [''];
        }
        
        // Handle genres
        if (book.genres && book.genres.length > 0) {
          this.genreIds = book.genres.map((g: any) => Number(g.id));
        }
        
        // Handle audiences
        if (book.audiences && book.audiences.length > 0) {
          this.audienceIds = book.audiences.map((a: any) => Number(a.id));
        }
        
        // Handle metadata
        if (book.metadata && typeof book.metadata === 'object') {
          this.metadata = Object.entries(book.metadata).map(([key, value]) => ({
            key,
            value: String(value)
          }));
        }
        
        // Handle inventory
        this.initialStock = book.inventory?.quantity || null;
        
        // Save original data for change detection
        this.originalData = { ...book };
        
        // Force change detection
        this.changeDetector.detectChanges();
        
        console.log('Form data after processing:', {
          title: this.title,
          genreIds: this.genreIds,
          audienceIds: this.audienceIds,
          inventory: this.initialStock
        });
      },
      error: (error) => {
        console.error('Error fetching book:', error);
        this.snackBar.open('Failed to load book data', 'Close', { duration: 3000 });
        this.router.navigate(['/admin/books']);
      }
    });
  }

  resetForm() {
    this.title = '';
    this.author = '';
    this.sellingPrice = null;
    this.costPrice = null;
    this.description = '';
    this.productType = 'New Book';
    this.images = [''];
    this.genreIds = [];
    this.audienceIds = [];
    this.initialStock = null;
    this.metadata = [];
    this.submitError = '';
    this.submitSuccess = false;
  }

  isFormChanged(): boolean {
    if (!this.isEditMode || !this.originalData) return true;

    // Helper function to compare values
    const isEqual = (a: any, b: any): boolean => {
      // Handle null/undefined cases
      if (a === b) return true;
      if (a == null || b == null) return false;
      
      // Handle arrays
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((val, i) => val === b[i]);
      }
      
      // Handle numbers (convert to strings to avoid type coercion issues)
      if (typeof a === 'number' || typeof b === 'number') {
        return String(a) === String(b);
      }
      
      // Handle objects
      if (typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        
        if (aKeys.length !== bKeys.length) return false;
        return aKeys.every(key => isEqual(a[key], b[key]));
      }
      
      return a === b;
    };

    // Compare basic fields
    const fieldsToCompare = [
      'title', 'author', 'description', 'productType'
    ] as const;

    for (const field of fieldsToCompare) {
      const currentValue = this[field];
      const originalValue = this.originalData[field];
      
      if (!isEqual(currentValue, originalValue)) {
        return true;
      }
    }

    // Compare numeric fields with proper type handling
    const numericFields = ['sellingPrice', 'costPrice', 'initialStock'] as const;
    for (const field of numericFields) {
      const currentValue = this[field];
      const originalValue = this.originalData[field];
      
      // Convert both to numbers and compare
      const currentNum = currentValue != null ? Number(currentValue) : null;
      const originalNum = originalValue != null ? Number(originalValue) : null;
      
      if (currentNum !== originalNum) {
        return true;
      }
    }

    // Compare arrays
    interface ArrayFieldConfig {
      current: 'images' | 'genreIds' | 'audienceIds';
      original: 'images' | 'genres' | 'audiences';
      idOnly?: boolean;
    }

    const arrayFields: ArrayFieldConfig[] = [
      { current: 'images', original: 'images' },
      { current: 'genreIds', original: 'genres', idOnly: true },
      { current: 'audienceIds', original: 'audiences', idOnly: true }
    ];

    for (const fieldConfig of arrayFields) {
      const { current, original, idOnly } = fieldConfig;
      const currentArray = [...(this[current] as any[]) || []];
      let originalArray = [...(this.originalData[original] || [])];
      
      if (idOnly && originalArray.length > 0 && typeof originalArray[0] === 'object') {
        originalArray = originalArray.map((item: any) => item.id);
      }
      
      if (!isEqual(currentArray.sort(), originalArray.sort())) {
        return true;
      }
    }

    // Compare metadata
    const currentMetadata = this.metadata
      .filter((m: any) => m.key && m.value)
      .reduce((acc: any, item: any) => ({
        ...acc,
        [item.key]: item.value
      }), {});

    const originalMetadata = this.originalData.metadata || {};
    
    return !isEqual(currentMetadata, originalMetadata);
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
          this.changeDetector.detectChanges();
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
          this.changeDetector.detectChanges();
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
    if (this.sellingPrice !== this.originalData.selling_price) payload.selling_price = this.sellingPrice;
    if (this.costPrice !== this.originalData.cost_price) payload.cost_price = this.costPrice;
    if (this.description !== this.originalData.description) payload.description = this.description;
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

  async onSubmit(form: any) {
    this.submitError = '';
    this.submitSuccess = false;
    
    if (!form.valid) {
      this.submitError = 'Please fill all required fields.';
      this.changeDetector.detectChanges();
      return;
    }
    
    if (!this.genreIds?.length || !this.audienceIds?.length) {
      this.submitError = 'Please select at least one genre and one audience.';
      this.changeDetector.detectChanges();
      return;
    }

    // Check if form has changes before submitting
    if (this.isEditMode && !this.isFormChanged()) {
      this.submitError = 'No changes detected. Please make changes before updating.';
      this.changeDetector.detectChanges();
      return;
    }

    this.submitting = true;
    this.changeDetector.detectChanges();

    try {
      if (this.isEditMode) {
        const payload = this.buildUpdatePayload();
        
        // Final check if payload has any changes (should be redundant but safe)
        if (Object.keys(payload).length === 0) {
          this.submitError = 'No changes to update.';
          this.submitting = false;
          this.changeDetector.detectChanges();
          return;
        }

        await this.productService.updateBook(this.productId!, payload).toPromise();
        this.snackBar.open('Book updated successfully!', 'Close', { 
          duration: 2000,
          panelClass: ['success-snackbar'] 
        });
      } else {
        // Handle create new book
        const metadataObj = this.metadata
          .filter((m: any) => m.key && m.value)
          .reduce((acc: any, item: any) => ({
            ...acc,
            [item.key]: item.value
          }), {});

        const newBook = {
          title: this.title,
          author: this.author,
          selling_price: Number(this.sellingPrice),
          cost_price: Number(this.costPrice),
          description: this.description || '',
          product_type: this.productType,
          images: this.images.filter((img: string) => img.trim()),
          genre_ids: this.genreIds,
          audience_ids: this.audienceIds,
          initial_stock: this.initialStock ? Number(this.initialStock) : 0,
          metadata: metadataObj
        };

        await this.productService.createProduct(newBook).toPromise();
        this.snackBar.open('Book created successfully!', 'Close', { 
          duration: 2000,
          panelClass: ['success-snackbar'] 
        });
      }
      
      // Navigate back to the books list after a short delay
      setTimeout(() => {
        this.router.navigate(['/admin']);
      }, 100);
      
    } catch (err: any) {
      const msg = err?.error?.message || (this.isEditMode ? 'Failed to update book.' : 'Failed to create book.');
      this.submitError = msg;
      this.snackBar.open(msg, 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.submitting = false;
      this.changeDetector.detectChanges();
    }
  }

  onCancel() {
    this.router.navigate(['/admin']);
  }

  onReset(form: any) {
    this.title = '';
    this.author = '';
    this.sellingPrice = null;
    this.costPrice = null;
    this.description = '';
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

  isSellingPriceLessThanCostPrice(): boolean {
    if (this.sellingPrice === null || this.sellingPrice === undefined ||
        this.costPrice === null || this.costPrice === undefined) {
      return false;
    }
    return +this.sellingPrice < +this.costPrice;
  }
}