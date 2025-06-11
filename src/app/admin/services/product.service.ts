import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  getBookById(id: string): Observable<any> {
    return this.http.get(`/api/v1/products/${id}`);
  }

  updateBook(id: string, payload: any): Observable<any> {
    return this.http.put(`/api/v1/products/${id}`, payload);
  }
} 