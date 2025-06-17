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
    // Update auth state
    this.authService.setAccessToken(response.accessToken);
    const user = this.authService.getUser();
    
    // Get the return URL from the auth service (set during checkout) or from query params
    const returnUrl = this.authService.redirectUrl || 
                    this.router.routerState.snapshot.root.queryParams['returnUrl'];
    
    // Clear the redirect URL after using it
    this.authService.redirectUrl = null;
    
    // Reset loading state in the next tick
    requestAnimationFrame(() => {
      this.loading = false;
      this.cdr.markForCheck();
      
      // The cart merge happens automatically in the backend when the session is associated with the user
      // We need to ensure the cart is refreshed after login
      this.authService.refreshCartAfterLogin().subscribe({
        next: () => this.navigateAfterLogin(returnUrl, user),
        error: (error) => {
          console.error('Error refreshing cart after login:', error);
          // Continue with navigation even if cart refresh fails
          this.navigateAfterLogin(returnUrl, user);
        }
      });
    });
  }
  
  private navigateAfterLogin(returnUrl: string | null, user: any) {
    // Schedule navigation in the next tick to avoid change detection issues
    Promise.resolve().then(() => {
      if (this.isModal) {
        // Close the modal first
        this.close.emit();
        
        // If we have a return URL, navigate after a small delay to allow the modal to close
        if (returnUrl) {
          setTimeout(() => this.router.navigateByUrl(returnUrl), 100);
        }
      } else if (returnUrl) {
        this.router.navigateByUrl(returnUrl);
      } else if (user?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    });
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