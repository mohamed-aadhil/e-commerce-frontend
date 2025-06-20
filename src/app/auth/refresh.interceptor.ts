import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';

export const RefreshInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  // Skip interceptor for non-API requests
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  
  console.log('RefreshInterceptor - Request:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    token: token ? `${token.substring(0, 10)}...` : 'none',
    existingHeaders: Object.keys(req.headers.keys())
  });

  // Clone the request with the token if available
  const authReq = req.clone({
    withCredentials: true,
    setHeaders: token ? { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {}
  });

  // Log the outgoing request
  console.log('RefreshInterceptor - Modified request headers:', {
    authorization: authReq.headers.get('Authorization') ? 'present' : 'missing',
    withCredentials: authReq.withCredentials
  });

  return next(authReq).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log('RefreshInterceptor - Response status:', event.status);
        }
      },
      error: (error) => {
        console.error('RefreshInterceptor - Error:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          headers: error.headers
        });
      }
    })
  );
};