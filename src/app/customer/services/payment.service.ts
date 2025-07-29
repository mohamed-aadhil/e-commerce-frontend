import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  makePayment(paymentData: any): Observable<any> {
    // Replace the URL with your actual payment API endpoint
    return this.http.post('/api/v1/payments', paymentData);
  }
} 