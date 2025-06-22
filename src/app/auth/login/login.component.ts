import { Component, Input, Output, EventEmitter, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, ApiError } from '../auth.service';

interface LoginForm {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  @Input() isModal = false;
  @Output() close = new EventEmitter<void>();
  @Output() switchToSignup = new EventEmitter<void>();
  form: LoginForm = {
    email: '',
    password: ''
  };
  
  errors: FormErrors = {};
  loading = false;
  emailTouched = false;
  passwordTouched = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  private validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.form.email) {
      this.errors['email'] = 'Email is required';
      isValid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.form.email)) {
      this.errors['email'] = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.form.password) {
      this.errors['password'] = 'Password is required';
      isValid = false;
    } else if (this.form.password.length < 6) {
      this.errors['password'] = 'Password must be at least 6 characters';
      isValid = false;
    }

    return isValid;
  }

  onSubmit() {
    // Mark form as touched for validation
    this.emailTouched = true;
    this.passwordTouched = true;
    
    if (!this.validateForm()) {
      return;
    }
    
    // Set loading state in the next tick to avoid change detection issues
    Promise.resolve().then(() => {
      this.loading = true;
      this.errors = {};
      this.cdr.markForCheck();
      
      this.authService.login(this.form.email, this.form.password).subscribe({
        next: (res) => {
          // Handle successful login
          if (res?.accessToken) {
            this.handleSuccessfulLogin(res);
          } else {
            this.setErrorState('Invalid response from server');
          }
        },
        error: (error) => {
          this.handleLoginError(error);
        }
      });
    });
  }
  
  private setErrorState(message: string): void {
    // Use requestAnimationFrame to ensure we're outside Angular's change detection
    requestAnimationFrame(() => {
      this.loading = false;
      this.errors = { general: message };
      this.cdr.markForCheck();
    });
  }
  
  private handleSuccessfulLogin(response: any) {
    try {
      console.log('[Login] Handling successful login response');
      
      if (!response?.accessToken) {
        throw new Error('No access token in login response');
      }

      console.log('[Login] Setting access token');
      this.authService.setAccessToken(response.accessToken);
      
      // Get user from the token
      const user = this.authService.getUser();
      console.log('[Login] User from token:', user);
      
      if (!user) {
        throw new Error('Failed to decode user information from token');
      }

      console.log('[Login] User logged in:', { 
        name: user.name, 
        role: user.role,
        token: response.accessToken.substring(0, 20) + '...' 
      });
      
      // Get the return URL from the auth service (set during checkout) or from query params
      const returnUrl = this.authService.redirectUrl || 
                      this.router.routerState.snapshot.root.queryParams['returnUrl'];
      
      console.log('[Login] Return URL:', returnUrl);
      
      // Clear the redirect URL after using it
      this.authService.redirectUrl = null;
      
      // Reset loading state
      this.loading = false;
      this.cdr.markForCheck();
      
      // Run navigation inside Angular's zone
      this.ngZone.run(() => {
        // For admin users, we don't need to wait for cart refresh
        if (user.role === 'admin') {
          console.log('[Login] Admin user detected, redirecting to admin dashboard');
          this.navigateAfterLogin(returnUrl, user);
          return;
        }
        
        // For regular users, refresh the cart before navigation
        console.log('[Login] Refreshing cart for regular user');
        this.authService.refreshCartAfterLogin().subscribe({
          next: () => {
            console.log('[Login] Cart refresh complete, navigating to destination');
            this.ngZone.run(() => this.navigateAfterLogin(returnUrl, user));
          },
          error: (error) => {
            console.error('[Login] Error refreshing cart after login:', error);
            // Continue with navigation even if cart refresh fails
            this.ngZone.run(() => this.navigateAfterLogin(returnUrl, user));
          }
        });
      });
    } catch (error) {
      console.error('[Login] Error in handleSuccessfulLogin:', error);
      this.setErrorState('An error occurred during login. Please try again.');
    }
  }
  
  private navigateAfterLogin(returnUrl: string | null, user: any) {
    console.log('[Login] Starting navigation after login');
    console.log('[Login] User role:', user?.role);
    console.log('[Login] Return URL:', returnUrl);
    
    // Store navigation logic in a separate function
    const performNavigation = () => {
      try {
        // Get the latest user data from auth service
        const currentUser = this.authService.getUser();
        const isAdmin = currentUser?.role === 'admin';
        
        console.log('[Login] Current user from auth service:', currentUser);
        console.log('[Login] Is admin:', isAdmin);
        
        // For admin users, always go to admin dashboard
        if (isAdmin) {
          console.log('[Login] Navigating to admin dashboard');
          this.router.navigate(['/admin']).then(() => {
            console.log('[Login] Navigation to admin dashboard complete');
          }).catch(err => {
            console.error('[Login] Error navigating to admin dashboard:', err);
            this.router.navigate(['/']);
          });
          return;
        }
        
        // For non-admin users, respect the return URL if it exists
        if (returnUrl) {
          console.log(`[Login] Navigating to return URL: ${returnUrl}`);
          this.router.navigateByUrl(returnUrl).catch(err => {
            console.error('[Login] Error navigating to return URL:', err);
            this.router.navigate(['/']);
          });
        } else {
          // Default to home for non-admin users with no return URL
          console.log('[Login] No return URL, navigating to home');
          this.router.navigate(['/']);
        }
      } catch (error) {
        console.error('[Login] Error during navigation after login:', error);
        this.router.navigate(['/']);
      }
    };
    
    // Close modal if this is a modal login
    if (this.isModal) {
      console.log('[Login] Closing modal');
      this.close.emit();
      
      // Use a small timeout to ensure the modal is closed before navigation
      setTimeout(() => {
        performNavigation();
      }, 100);
    } else {
      // If not a modal, navigate immediately
      performNavigation();
    }
  }
  
  private handleLoginError(error: any) {
    console.log('Raw error object:', error);
    
    // Always create a new errors object to trigger change detection
    this.errors = { general: 'Invalid email or password. Please try again.' };
    
    // Force change detection
    setTimeout(() => {
      this.errors = { ...this.errors };
    });
  }
  
  onFieldBlur(field: keyof LoginForm) {
    if (field === 'email') this.emailTouched = true;
    if (field === 'password') this.passwordTouched = true;
    this.validateForm();
  }

  onClose() {
    this.close.emit();
  }

  onSwitchToSignup() {
    this.switchToSignup.emit();
  }
} 