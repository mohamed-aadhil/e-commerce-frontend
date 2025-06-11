import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GenreService, ProductDetails } from '../../services/genre.service';
import { Header } from '../../components/header/header';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, Header, RouterModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css'
})
export class ProductDetailsPage implements OnInit {
  product: ProductDetails | null = null;
  loading = true;
  error = false;

  constructor(private route: ActivatedRoute, private genreService: GenreService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        this.loading = true;
        this.error = false;
        this.genreService.getProductDetails(+productId).subscribe({
          next: (product: ProductDetails | null) => {
            this.product = product;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.error = true;
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}
