import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor as AngularHttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable()
export class HttpInterceptor implements AngularHttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip if the request is already absolute
    if (request.url.startsWith('http')) {
      return next.handle(request);
    }

    // Add a leading slash to the URL if it doesn't have one
    const url = request.url.startsWith('/') ? request.url : `/${request.url}`;
    
    // Clone the request and add API URL and credentials
    const modifiedRequest = request.clone({
      url: `${environment.apiUrl}${url}`,
      withCredentials: environment.withCredentials
    });

    console.log('Making request to:', modifiedRequest.url); // Debug log

    // Pass the cloned request to the next handler
    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle HTTP errors here
        console.error('HTTP Error:', error);
        return throwError(() => error);
      })
    );
  }
}
