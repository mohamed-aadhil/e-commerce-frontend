import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService, Audience, ProductCard } from '../../services/product.service';
import { ProductCard as ProductCardComponent } from '../../components/product-card/product-card';
import { SharedHeader } from '../../../shared/header/header';
import { SharedFooter } from '../../../shared/footer/footer';

@Component({
  selector: 'app-audience-products',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ProductCardComponent, 
    SharedHeader, 
    SharedFooter, 
    RouterModule
  ],
  templateUrl: './audience-products.html',
  styleUrls: ['./audience-products.css']
})
export class AudienceProducts implements OnInit {
  audience: Audience | null = null;
  audiences: Audience[] = [];
  products: ProductCard[] = [];
  loading = true;
  error = false;
  sortOption: string = 'price-asc';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const audienceId = params.get('id');
      if (audienceId) {
        this.loading = true;
        this.error = false;
        this.productService.getAudiences().subscribe({
          next: (audiences: Audience[]) => {
            this.audiences = audiences;
            this.audience = audiences.find(a => a.id === +audienceId) || null;
            this.fetchProducts(+audienceId);
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

  fetchProducts(audienceId: number) {
    this.productService.getProductsForAudience(audienceId).subscribe({
      next: (products: ProductCard[]) => {
        this.products = products;
        this.sortProducts();
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

  sortProducts() {
    if (this.sortOption === 'price-asc') {
      this.products.sort((a, b) => a.selling_price - b.selling_price);
    } else if (this.sortOption === 'price-desc') {
      this.products.sort((a, b) => b.selling_price - a.selling_price);
    }
  }
}
