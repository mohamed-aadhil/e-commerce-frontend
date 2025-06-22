import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    console.log('[AuthGuard] AuthGuard instantiated');
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    console.log('[AuthGuard] Checking access for route:', state.url);
    console.log('[AuthGuard] Route config:', route.routeConfig);
    console.log('[AuthGuard] Route data:', route.data);
    
    try {
      // Wait for any ongoing refresh to complete
      if (this.authService.refreshInProgress) {
        console.log('[AuthGuard] Waiting for token refresh to complete...');
        await this.authService.refreshInProgress;
        console.log('[AuthGuard] Token refresh complete');
      }

      // Get the current user and required role
      const user = this.authService.getUser();
      const requiredRole = route.data?.['role'];
      
      console.log('[AuthGuard] Current user:', user);
      console.log('[AuthGuard] Required role:', requiredRole || 'none');
      
      // Check if user is authenticated
      const isAuthenticated = this.authService.isAuthenticated();
      console.log('[AuthGuard] Is authenticated:', isAuthenticated);
      
      // If no specific role is required, just check authentication
      if (!requiredRole) {
        console.log('[AuthGuard] No role required, access granted');
        return isAuthenticated;
      }
      
      // If role is required, check both authentication and role
      if (isAuthenticated && user) {
        // Check if user has the required role
        const hasRequiredRole = user.role === requiredRole;
        console.log(`[AuthGuard] User role: ${user.role}, Has required role: ${hasRequiredRole}`);
        
        // If user is admin, always grant access
        if (user.role === 'admin') {
          console.log('[AuthGuard] Admin access granted');
          return true;
        }
        
        // Check for specific role requirements
        if (hasRequiredRole) {
          console.log('[AuthGuard] Role-based access granted');
          return true;
        }
        
        // If user doesn't have required role, redirect to home
        console.log('[AuthGuard] Insufficient permissions, redirecting to home');
        await this.router.navigate(['/']);
        return false;
      }
      
      // If not authenticated, redirect to login with return URL
      console.log('[AuthGuard] Not authenticated, redirecting to login');
      this.authService.redirectUrl = state.url;
      await this.router.navigate(['/login']);
      return false;
    } catch (error) {
      console.error('[AuthGuard] Error during route activation:', error);
      await this.router.navigate(['/']);
      return false;
    }
  }
} 