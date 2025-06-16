import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export const RefreshInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  console.log('RefreshInterceptor:', { url: req.url, token });
  // Always include credentials with requests
  const cloned = req.clone({
    withCredentials: true,
    setHeaders: token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {}
  });
  return next(cloned);
};