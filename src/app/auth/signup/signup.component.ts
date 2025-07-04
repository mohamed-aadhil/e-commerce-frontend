import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';
import { AuthService, ApiError } from '../auth.service';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  @Input() isModal = false;
  @Output() close = new EventEmitter<'close' | 'switch'>();
  @Output() switchToLogin = new EventEmitter<void>();
  form: SignupForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  errors: FormErrors = {};
  loading = false;
  nameTouched = false;
  registrationSuccess = false;
  emailTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    // Name validation
    if (!this.form.name) {
      this.errors['name'] = 'Name is required';
      isValid = false;
    } else if (this.form.name.length < 2) {
      this.errors['name'] = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    if (!this.form.email) {
      this.errors['email'] = 'Email is required';
      isValid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.form.email)) {
      this.errors['email'] = 'Please enter a valid email address';
      isValid = false;
    } else if (this.form.email.toLowerCase().includes('admin')) {
      this.errors['email'] = 'This email cannot be used for signup';
      isValid = false;
    }

    // Password validation
    if (!this.form.password) {
      this.errors['password'] = 'Password is required';
      isValid = false;
    } else if (this.form.password.length < 6) {
      this.errors['password'] = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!this.form.confirmPassword) {
      this.errors['confirmPassword'] = 'Please confirm your password';
      isValid = false;
    } else if (this.form.password !== this.form.confirmPassword) {
      this.errors['confirmPassword'] = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  onSubmit() {
    // Mark all fields as touched
    this.nameTouched = true;
    this.emailTouched = true;
    this.passwordTouched = true;
    this.confirmPasswordTouched = true;
    
    // Validate form
    if (!this.validateForm()) {
      return;
    }
    
    console.log('Submitting form...');
    
    this.loading = true;
    this.errors = {};
    this.cdr.detectChanges();
    
    // Remove confirmPassword before sending to the server
    const { confirmPassword, ...signupData } = this.form;
    
    // Get the current session ID for cart merging
    const sessionId = this.getSessionId();
    
    this.authService.signup({ ...signupData, sessionId }).subscribe({
      next: (response) => {
        this.loading = false;
        this.registrationSuccess = true;
        this.cdr.detectChanges();
        
        // Automatically log in the user after successful registration
        this.authService.setAccessToken(response.accessToken);
        
        // Handle cart merge status if needed
        if (response.cartMerged) {
          console.log('Cart was merged during registration');
        }
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          if (this.isModal) {
            this.close.emit('close');
          } else {
            this.router.navigate(['/']);
          }
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        console.error('Registration error:', error);
        if (error?.error?.errors) {
          this.errors = error.error.errors;
        } else {
          this.errors = { 
            general: error.error?.message || 'An error occurred during registration. Please try again.' 
          };
        }
        this.cdr.detectChanges();
      }
    });
  }
  
  // Helper to get the current session ID from cookies
  private getSessionId(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'connect.sid') {
        return value;
      }
    }
    return null;
  }

  private handleSuccessfulSignup(response: any) {
    this.registrationSuccess = true;
    this.cdr.detectChanges();
    
    // Auto-close the modal after 2 seconds
    setTimeout(() => {
      this.authService.setAccessToken(response.accessToken);
      const user = this.authService.getUser();
      const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'];
      
      if (returnUrl) {
        this.router.navigateByUrl(returnUrl);
      } else if (user?.role === 'admin') {
        this.errors = { general: 'Signup is only for customers. Admins must use their own credentials.' };
        this.registrationSuccess = false;
        this.cdr.detectChanges();
      } else {
        this.close.emit();
      }
    }, 2000);
  }
  
  private handleSignupError(error: any) {
    console.log('handleSignupError called with:', error);
    
    // Ensure loading is set to false
    this.loading = false;
    
    // Clear previous errors
    this.errors = {};
    
    // Log the full error for debugging
    console.error('Signup error details:', {
      status: error.status,
      message: error.message,
      error: error.error,
      errors: error.errors
    });
    
    if (error.status === 409) {
      // Handle duplicate email error
      this.errors = {
        email: 'This email is already registered. Please use a different email or sign in.',
        general: 'This email is already registered.'
      };
    } else if (error.status === 422 && error.errors) {
      // Handle validation errors
      Object.entries(error.errors).forEach(([field, messages]) => {
        const fieldName = field === 'name' || field === 'email' || field === 'password' ? field : 'general';
        this.errors[fieldName] = Array.isArray(messages) ? messages[0] : messages;
      });
    } else {
      // Handle other errors
      this.errors.general = error.message || 'Signup failed. Please try again.';
    }
    
    console.log('Errors after handling:', this.errors);
    this.cdr.detectChanges();
  }
  
  onFieldBlur(field: keyof SignupForm) {
    this[`${field}Touched` as const] = true;
    this.validateForm();
    
    // Special handling for password confirmation
    if (field === 'password' || field === 'confirmPassword') {
      if (this.passwordTouched && this.confirmPasswordTouched && this.form.password !== this.form.confirmPassword) {
        this.errors['confirmPassword'] = 'Passwords do not match';
      } else if (this.errors['confirmPassword'] === 'Passwords do not match') {
        delete this.errors['confirmPassword'];
      }
    }
    
    this.cdr.detectChanges();
  }
  
  onClose() {
    if (!this.loading) {
      this.close.emit();
    }
  }

  onSwitchToLogin(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.close.emit('switch');
  }
}