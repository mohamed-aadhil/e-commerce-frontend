import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor as AngularHttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HttpInterceptor implements AngularHttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Clone the request and add withCredentials: true
    const modifiedRequest = request.clone({
      withCredentials: true
    });

    // Pass the cloned request to the next handler
    return next.handle(modifiedRequest);
  }
}
