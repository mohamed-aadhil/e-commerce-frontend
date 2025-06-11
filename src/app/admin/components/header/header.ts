import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'admin-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class AdminHeader {
  showDropdown = false;
  adminName = '';

  constructor(private authService: AuthService, private router: Router) {
    this.authService.user$.subscribe(user => {
      this.adminName = user?.name || '';
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearAccessToken();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.authService.clearAccessToken();
        this.router.navigate(['/auth/login']);
      }
    });
    this.showDropdown = false;
  }
} 