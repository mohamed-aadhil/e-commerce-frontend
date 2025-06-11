import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate: CanActivateFn = async (route, state) => {
    if (this.authService.refreshInProgress) {
      await this.authService.refreshInProgress;
    }
    const token = this.authService.getAccessToken();
    const user = this.authService.getUser();
    const requiredRole = route.data && route.data['role'];
    if (token && (!requiredRole || user?.['role'] === requiredRole)) {
      return true;
    }
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  };
} 