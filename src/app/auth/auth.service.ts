import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user?: any;
  cartMerged?: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: { [key: string]: string[] };
}

export interface DecodedToken {
  name: string;
  role: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;
  private userSubject = new BehaviorSubject<DecodedToken | null>(null);
  user$ = this.userSubject.asObservable();
  refreshInProgress: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get the current session ID from the browser's cookies
   */
  private getSessionId(): string | null {
    // The session cookie name might vary based on your backend configuration
    // This is a common default for express-session
    const match = document.cookie.match(/ecommerce\.sid=([^;]+)/);
    return match ? match[1] : null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const sessionId = this.getSessionId();
    console.log('[AuthService] Login with session ID:', sessionId);
    
    return this.http.post<AuthResponse>('/api/v1/auth/login', { 
      email, 
      password, 
      sessionId 
    }, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  signup(data: any): Observable<AuthResponse> {
    const sessionId = this.getSessionId();
    console.log('[AuthService] Signup with session ID:', sessionId);
    
    return this.http.post<AuthResponse>('/api/v1/auth/register', {
      ...data,
      sessionId
    }, { withCredentials: true }).pipe(
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    this.clearAccessToken();
    return this.http.post('/api/v1/auth/logout', {}, { withCredentials: true });
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    try {
      const decoded: DecodedToken = jwtDecode(token) as DecodedToken;
      this.userSubject.next(decoded);
    } catch (e) {
      this.userSubject.next(null);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
    this.userSubject.next(null);
  }

  /**
   * Refresh the cart after login to ensure it's in sync with the server
   * This triggers a cart refresh which will merge the guest cart with the user's cart
   */
  refreshCartAfterLogin() {
    // The actual cart refresh is handled by the CartService's interceptor
    // This method just triggers a dummy request to refresh the cart
    return this.http.get('/api/v1/cart', { withCredentials: true });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('AuthService error:', error);
    
    let errorMessage = 'An error occurred';
    let errorDetails: any = {};
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      const serverError = error.error;
      
      // Handle 409 Conflict (duplicate email)
      if (error.status === 409) {
        errorMessage = serverError?.message || 'This email is already registered';
        errorDetails = { email: errorMessage };
      } 
      // Handle 400 Bad Request
      else if (error.status === 400) {
        errorMessage = serverError?.message || 'Invalid request';
        if (serverError?.errors) {
          errorDetails = serverError.errors;
        }
      } 
      // Handle server errors
      else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } 
      // Handle other errors
      else {
        errorMessage = serverError?.message || error.statusText || 'An error occurred';
      }
      
      // If we have a validation error object, use it
      if (serverError?.error) {
        errorDetails = serverError.error;
      }
    }
    
    const errorResponse = {
      status: error.status,
      message: errorMessage,
      errors: errorDetails,
      error: error.error
    };
    
    console.log('AuthService error response:', errorResponse);
    return throwError(() => errorResponse);
  }

  refreshToken(): Promise<void> {
    if (this.refreshInProgress) return this.refreshInProgress;
    
    this.refreshInProgress = new Promise((resolve) => {
      this.http.post<AuthResponse>('/api/v1/auth/refresh', {})
        .pipe(
          catchError(error => {
            this.clearAccessToken();
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (res) => {
            if (res?.accessToken) {
              this.setAccessToken(res.accessToken);
            } else {
              this.clearAccessToken();
            }
            resolve();
          },
          error: () => {
            this.clearAccessToken();
            resolve();
          },
          complete: () => {
            this.refreshInProgress = null;
          }
        });
    });
    
    return this.refreshInProgress;
  }

  getUser(): DecodedToken | null {
    return this.userSubject.value;
  }

  getUserName(): string | null {
    return this.userSubject.value?.name || null;
  }

  getUserRole(): string | null {
    return this.userSubject.value?.role || null;
  }
} 