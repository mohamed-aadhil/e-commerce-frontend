import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
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
          // Redirect based on role or returnUrl
          const user = this.authService.getUser();
          const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else if (user && user['role'] === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.error = 'Invalid response from server';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Signup failed';
        this.loading = false;
      }
    });
  }
} 