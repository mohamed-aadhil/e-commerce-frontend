import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenreService, Genre, ProductCard as ProductCardModel } from '../../services/genre.service';
import { GenreCard } from '../../components/genre-card/genre-card';
import { ProductCard as ProductCardComponent } from '../../components/product-card/product-card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, GenreCard, ProductCardComponent],
  templateUrl: './home.html',
})
export class Home implements OnInit {
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
  products: ProductCardModel[] = [];
  loadingProducts = false;
  productError = false;

  constructor(private genreService: GenreService, private router: Router) {}

  ngOnInit() {
    this.startAutoSlide();
    this.fetchGenres();
  }

  fetchGenres() {
    this.loadingGenres = true;
    this.genreError = false;
    this.genreService.getGenres().subscribe({
      next: (genres: Genre[]) => {
        this.genres = genres;
        this.loadingGenres = false;
      },
      error: () => {
        this.genreError = true;
        this.loadingGenres = false;
      }
    });
  }

  onGenreSelect(genre: Genre) {
    this.router.navigate(['/genre', genre.id]);
  }

  fetchProductsByGenre(genreId: number) {
    this.loadingProducts = true;
    this.productError = false;
    this.products = [];
    this.genreService.getProductsByGenre(genreId).subscribe({
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
