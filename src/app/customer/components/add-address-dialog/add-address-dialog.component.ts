import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Address, AddressService } from '../../services/address.service';

@Component({
  selector: 'app-add-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Address</h2>
    <mat-dialog-content>
      <form [formGroup]="addressForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Recipient Name</mat-label>
          <input matInput formControlName="recipientName" required>
          <mat-error *ngIf="addressForm.get('recipientName')?.hasError('required')">
            Recipient name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Mobile Number</mat-label>
          <input matInput formControlName="mobileNumber" type="tel" required>
          <mat-error *ngIf="addressForm.get('mobileNumber')?.hasError('required')">
            Mobile number is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Address Line 1</mat-label>
          <input matInput formControlName="addressLine1" required>
          <mat-error *ngIf="addressForm.get('addressLine1')?.hasError('required')">
            Address line 1 is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Address Line 2 (Optional)</mat-label>
          <input matInput formControlName="addressLine2">
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>City</mat-label>
            <input matInput formControlName="city" required>
            <mat-error *ngIf="addressForm.get('city')?.hasError('required')">
              City is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>State/Province</mat-label>
            <input matInput formControlName="state" required>
            <mat-error *ngIf="addressForm.get('state')?.hasError('required')">
              State/Province is required
            </mat-error>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Postal Code</mat-label>
            <input matInput formControlName="postal_code" required>
            <mat-error *ngIf="addressForm.get('postal_code')?.hasError('required')">
              Postal code is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Country</mat-label>
            <mat-select formControlName="country" required>
              <mat-option *ngFor="let country of countries" [value]="country">
                {{ country }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="addressForm.get('country')?.hasError('required')">
              Country is required
            </mat-error>
          </mat-form-field>
        </div>

        <mat-checkbox formControlName="is_default" class="mb-4">
          Set as default address
        </mat-checkbox>

        <div class="flex justify-end gap-2">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="!addressForm.valid || isSubmitting"
          >
            <span *ngIf="isSubmitting" class="flex items-center">
              <span class="animate-spin mr-2">↻</span>
              Saving...
            </span>
            <span *ngIf="!isSubmitting">Save Address</span>
          </button>
        </div>
      </form>
    </mat-dialog-content>
  `,
  styles: [`
    .w-full { width: 100%; }
    .mat-mdc-form-field { margin-bottom: 8px; }
  `]
})
export class AddAddressDialogComponent {
  addressForm: FormGroup;
  isSubmitting = false;
  
  countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Japan',
    'China',
    'India',
    'Brazil'
  ];

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string }
  ) {
    this.addressForm = this.fb.group({
      recipientName: ['', [Validators.required]],
      mobileNumber: ['', [Validators.required]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]],
      isDefault: [false]
    });
  }

  onSubmit(): void {
    if (this.addressForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    
    // Format the address data to match backend expectations
    const addressData = {
      recipientName: this.addressForm.value.recipientName,
      mobileNumber: this.addressForm.value.mobileNumber,
      addressLine1: this.addressForm.value.addressLine1,
      addressLine2: this.addressForm.value.addressLine2 || '',
      city: this.addressForm.value.city,
      state: this.addressForm.value.state,
      postalCode: this.addressForm.value.postalCode,
      country: this.addressForm.value.country,
      isDefault: this.addressForm.value.isDefault || false
    };
    
    this.addressService.createAddress(addressData).subscribe({
      next: (newAddress: Address) => {
        this.isSubmitting = false;
        this.snackBar.open('Address added successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(newAddress);
      },
      error: (error: any) => {
        console.error('Error adding address:', error);
        this.isSubmitting = false;
        this.snackBar.open(
          error.error?.message || 'Failed to add address. Please try again.',
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
