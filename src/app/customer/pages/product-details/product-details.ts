import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, ProductDetails } from '../../services/product.service';
import { SharedHeader } from '../../../shared/header/header';
import { RouterModule } from '@angular/router';
import { SharedFooter } from '../../../shared/footer/footer';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AddToCartComponent } from '../../components';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule, 
    SharedHeader, 
    SharedFooter, 
    RouterModule,
    MatSnackBarModule,
    FormsModule, // Add FormsModule for ngModel
    AddToCartComponent
  ],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css'] // Fix styleUrl to styleUrls
})
export class ProductDetailsPage implements OnInit {
  product: ProductDetails | null = null;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute, 
    private productService: ProductService, 
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        this.loading = true;
        this.error = false;
        this.productService.getProductDetails(+productId).subscribe({
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

  onBuyNow() {
    if (!this.product) return;
    
    // Navigate directly to checkout with the product details
    this.router.navigate(['/checkout'], {
      queryParams: {
        productId: this.product.id,
        quantity: 1 // Default to 1 since we removed the quantity selector
      }
    });
  }
}
