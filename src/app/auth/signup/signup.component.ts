import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  @Input() isModal = false;
  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();
  name = '';
  email = '';
  password = '';
  error: string | null = null;
  loading = false;
  nameTouched = false;
  emailTouched = false;
  passwordTouched = false;

  constructor(private authService: AuthService, private router: Router) {}

  validateEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  onSubmit() {
    this.nameTouched = true;
    this.emailTouched = true;
    this.passwordTouched = true;
    this.error = null;
    // Prevent signup for admin emails (e.g., admin@domain.com or any logic you want)
    if (this.email && this.email.toLowerCase().includes('admin')) {
      this.error = 'Signup is only for customers. Admins must use their own credentials.';
      return;
    }
    if (!this.name || !this.email || !this.password) {
      this.error = 'Name, email, and password are required.';
      return;
    }
    if (!this.validateEmail(this.email)) {
      this.error = 'Please enter a valid email address.';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters.';
      return;
    }
    this.loading = true;
    this.authService.signup({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res && res.accessToken) {
          this.authService.setAccessToken(res.accessToken);
          const user = this.authService.getUser();
          const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else if (user && user['role'] === 'admin') {
            this.error = 'Signup is only for customers. Admins must use their own credentials.';
            this.loading = false;
            return;
          } else {
            this.close.emit();
          }
        } else {
          this.error = 'Invalid response from server';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Signup failed';
        this.loading = false;
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  onSwitchToLogin() {
    this.switchToLogin.emit();
  }
} 