import { Injectable } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private authService: AuthService) {}

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
    // TODO: Trigger login modal globally here
    return false;
  };
} 