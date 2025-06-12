import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

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

  login(email: string, password: string): Observable<any> {
    // Implement login logic
    return this.http.post('/api/v1/auth/login', { email, password });
  }

  signup(data: any): Observable<any> {
    // Implement signup logic
    return this.http.post('/api/v1/auth/register', data);
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

  refreshToken(): Promise<void> {
    if (this.refreshInProgress) return this.refreshInProgress;
    this.refreshInProgress = new Promise((resolve) => {
      this.http.post<any>('/api/v1/auth/refresh', {}).subscribe({
        next: (res) => {
          if (res && res.accessToken) {
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