import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LoginComponent } from '../../auth/login/login.component';
import { SignupComponent } from '../../auth/signup/signup.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { CartIconComponent } from '../../customer/components';

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoginComponent,
    SignupComponent,
    SearchBarComponent,
    CartIconComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class SharedHeader {
  showDropdown = false;
  userName = '';
  userRole: string | null = null;
  isSearchFocused = false;
  isCustomer = false;

  showLoginModal = false;
  showSignupModal = false;
  
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    this.authService.user$.subscribe(user => {
      this.userName = user?.name || '';
      this.userRole = user?.role || null;
            this.isCustomer = this.userRole !== 'admin';
    });
  }

  onSearchFocusChange(isFocused: boolean): void {
    this.isSearchFocused = isFocused;
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearAccessToken();
        this.router.navigate(['/']);
      },
      error: () => {
        this.authService.clearAccessToken();
        this.router.navigate(['/']);
      }
    });
    this.showDropdown = false;
  }

  openLoginModal() {
    this.showLoginModal = true;
    this.showSignupModal = false;
  }

  closeLoginModal() {
    this.showLoginModal = false;
  }

  openSignupModal() {
    this.showSignupModal = true;
    this.showLoginModal = false;
  }

  closeSignupModal() {
    this.showSignupModal = false;
  }
} 