import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Address {
  id?: number;
  user_id?: number;
  recipientName: string;
  mobileNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/api/v1/me/addresses`;

  constructor(private http: HttpClient) {}

  // Get all addresses for the current user
  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.apiUrl);
  }

  // Get a single address by ID
  getAddress(id: number): Observable<Address> {
    return this.http.get<Address>(`${this.apiUrl}/${id}`);
  }

  // Create a new address
  createAddress(address: Partial<Address>): Observable<Address> {
    return this.http.post<Address>(this.apiUrl, address);
  }

  // Update an existing address
  updateAddress(id: number, address: Partial<Address>): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/${id}`, address);
  }

  // Delete an address
  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Set an address as default
  setDefaultAddress(id: number): Observable<Address> {
    return this.http.patch<Address>(`${this.apiUrl}/${id}/set-default`, {});
  }
}
