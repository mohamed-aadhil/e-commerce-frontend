import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

import { ProductService, ProductDetails } from '../../services/product.service';
import { SharedHeader } from '../../../shared/header/header';
import { SharedFooter } from '../../../shared/footer/footer';
import { AddToCartComponent } from '../../components';
import { AuthService } from '../../../auth/auth.service';
import { LoginComponent } from '../../../auth/login/login.component';
import { SignupComponent } from '../../../auth/signup/signup.component';


@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule, 
    SharedHeader, 
    SharedFooter, 
    RouterModule,
    MatSnackBarModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormsModule,
    AddToCartComponent,
    LoginComponent,
    SignupComponent
  ],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css'] // Fix styleUrl to styleUrls
})
export class ProductDetailsPage implements OnInit {
  product: ProductDetails | null = null;
  loading = true;
  error = false;
  isBuyingNow = false;
  showLoginModal = false;
  showSignupModal = false;


  constructor(
    private route: ActivatedRoute, 
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  async onBuyNow() {
    if (!this.product) return;

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.openLoginDialog();
      return;
    }

    // TODO: Implement new checkout flow
    this.snackBar.open('Checkout flow coming soon!', 'OK', { duration: 3000 });
  }

  /**
   * Open login dialog for unauthenticated users
   */
  /**
   * Open login dialog for unauthenticated users
   */
  private openLoginDialog(): void {
    this.authService.redirectUrl = this.router.url;
    this.showLoginModal = true;
  }

  onLoginModalClose(): void {
    this.showLoginModal = false;
  }

  onSwitchToSignup(): void {
    this.showLoginModal = false;
    this.showSignupModal = true;
  }

  onSignupModalClose(reason?: 'close' | 'switch'): void {
    this.showSignupModal = false;
    if (reason === 'switch') {
      this.showLoginModal = true;
    }
  }

  onSwitchToLogin(): void {
    this.showSignupModal = false;
    this.showLoginModal = true;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: any) => {
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


}
