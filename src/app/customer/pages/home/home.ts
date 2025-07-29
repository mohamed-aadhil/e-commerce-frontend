import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Genre, ProductCard as ProductCardModel, Audience } from '../../services/product.service';
import { GenreCard } from '../../components/genre-card/genre-card';
import { AudienceCard } from '../../components/audience-card/audience-card';
import { Router, RouterModule } from '@angular/router';
import { SharedHeader } from '../../../shared/header/header';
import { AuthService } from '../../../auth/auth.service';
import { SharedFooter } from '../../../shared/footer/footer';
import { LoginComponent } from '../../../auth/login/login.component';
import { SignupComponent } from '../../../auth/signup/signup.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule, 
    GenreCard, 
    AudienceCard, 
    SharedHeader, 
    SharedFooter, 
    RouterModule,
    LoginComponent,
    SignupComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  // Modal states
  showLoginModal = false;
  showSignupModal = false;
  quotes = [
    {
      text: "A room without books is like a body without a soul.",
      author: "Marcus Tullius Cicero"
    },
    {
      text: "So many books, so little time.",
      author: "Frank Zappa"
    },
    {
      text: "The only thing you absolutely have to know is the location of the library.",
      author: "Albert Einstein"
    }
  ];
  current = 0;
  intervalId: any;
  genres: Genre[] = [];
  loadingGenres = true;
  genreError = false;
  selectedGenre: Genre | null = null;
  audiences: Audience[] = [];
  loadingAudiences = true;
  audienceError = false;
  products: ProductCardModel[] = [];
  loadingProducts = false;
  productError = false;

  // Modal Handlers
  onLoginModalClose(): void {
    this.showLoginModal = false;
  }

  onSignupModalClose(reason?: 'close' | 'switch'): void {
    this.showSignupModal = false;
    if (reason === 'switch') {
      this.showLoginModal = true;
    }
  }

  onSwitchToSignup(): void {
    this.showLoginModal = false;
    this.showSignupModal = true;
  }

  onSwitchToLogin(): void {
    this.showSignupModal = false;
    this.showLoginModal = true;
  }

  constructor(
    private productService: ProductService, 
    private router: Router, 
    private cdr: ChangeDetectorRef, 
    private authService: AuthService
  ) {
    this.authService.user$.subscribe((user: any) => {
      if (user?.role === 'admin') {
        this.router.navigate(['/admin']);
      }
    });
    this.startAutoSlide();
    this.fetchGenres();
    this.fetchAudiences();
  }

  ngOnInit() {
    this.startAutoSlide();
    this.fetchGenres();
  }

  fetchGenres() {
    this.loadingGenres = true;
    this.genreError = false;
    this.productService.getGenres().subscribe({
      next: (genres: Genre[]) => {
        console.log('Genres loaded:', genres);
        this.genres = genres;
        this.loadingGenres = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.genreError = true;
        this.loadingGenres = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchAudiences() {
    this.loadingAudiences = true;
    this.audienceError = false;
    this.productService.getAudiences().subscribe({
      next: (audiences: Audience[]) => {
        console.log('Audiences loaded:', audiences);
        this.audiences = audiences;
        this.loadingAudiences = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.audienceError = true;
        this.loadingAudiences = false;
        this.cdr.detectChanges();
      }
    });
  }

  onAudienceSelect(audience: Audience) {
    this.router.navigate(['/audience', audience.id, 'products']);
  }

  onGenreSelect(genre: Genre) {
    this.router.navigate(['/genre', genre.id, 'products']);
  }

  fetchProductsByGenre(genreId: number) {
    this.loadingProducts = true;
    this.productError = false;
    this.products = [];
    this.productService.getProductsForGenre(genreId).subscribe({
      next: (products: ProductCardModel[]) => {
        this.products = products;
        this.loadingProducts = false;
      },
      error: () => {
        this.productError = true;
        this.loadingProducts = false;
      }
    });
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => {
      this.next();
    }, 4000);
  }

  stopAutoSlide() {
    clearInterval(this.intervalId);
  }

  next() {
    this.current = (this.current + 1) % this.quotes.length;
  }

  prev() {
    this.current = (this.current - 1 + this.quotes.length) % this.quotes.length;
  }

  goTo(index: number) {
    this.current = index;
  }
}
