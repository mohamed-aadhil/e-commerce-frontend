import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Address, AddressService } from '../../services/address.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

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
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-title">Add Address</div>
      <form [formGroup]="addressForm" (ngSubmit)="saveAddress()" class="form-group">
        <div>
          <label>Recipient Name</label>
          <input type="text" formControlName="recipientName" required />
        </div>
        <div>
          <label>Mobile Number</label>
          <input type="text" formControlName="mobileNumber" required />
        </div>
        <div>
          <label>Address Line 1</label>
          <input type="text" formControlName="addressLine1" required />
        </div>
        <div>
          <label>Address Line 2 (Optional)</label>
          <input type="text" formControlName="addressLine2" />
        </div>
        <div class="form-row">
          <div>
            <label>City</label>
            <input type="text" formControlName="city" required />
          </div>
          <div>
            <label>State/Province</label>
            <input type="text" formControlName="state" required />
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Postal Code</label>
            <input type="text" formControlName="postalCode" required />
          </div>
          <div>
            <label>Country</label>
            <input type="text" formControlName="country" required placeholder="Enter Country" class="country-input" />
          </div>
        </div>
        <div class="actions">
          <button type="button" class="cancel" (click)="onCancel()">Cancel</button>
          <button type="submit" class="save">Next</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      margin: auto;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .dialog-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: #1a237e;
      text-align: center;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .form-row > * {
      flex: 1;
    }

    label {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 4px;
      color: #333;
      display: block;
    }

    input, select {
      padding: 10px 12px;
      border: 1px solid #bdbdbd;
      border-radius: 8px;
      font-size: 1rem;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 2px;
      transition: border-color 0.2s;
    }

    input:focus, select:focus {
      border-color: #3f51b5;
      outline: none;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 10px;
    }

    button {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    button.save {
      background: #3f51b5;
      color: #fff;
      font-weight: 600;
    }

    button.save:hover {
      background: #283593;
    }

    button.cancel {
      background: #e0e0e0;
      color: #333;
    }

    button.cancel:hover {
      background: #bdbdbd;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    .country-input {
      padding: 10px 12px;
      border: 1.5px solid #bdbdbd;
      border-radius: 8px;
      font-size: 1rem;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 2px;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: #fafbff;
    }
    .country-input:focus {
      border-color: #3f51b5;
      box-shadow: 0 0 0 2px #3f51b533;
      outline: none;
    }
    .country-input:hover {
      border-color: #283593;
    }
  `]
})
export class AddAddressDialogComponent {
  addressForm: FormGroup;
  isSubmitting = false;
  
  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string },
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.addressForm = this.fb.group({
      recipientName: ['', [Validators.required]],
      mobileNumber: ['', [Validators.required]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.addressForm.invalid) return;

    this.isSubmitting = true;

    const addressData = this.addressForm.value;

    this.addressService.createAddress(addressData).subscribe({
      next: (newAddress: Address) => {
        this.isSubmitting = false;
        this.snackBar.open('Address added successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(newAddress);
        setTimeout(() => {
          this.router.navigate(['/checkout/payment']);
        }, 100);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.snackBar.open(
          error.error?.message || error.statusText || 'Failed to add address. Please try again.',
          'Close', { duration: 4000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Add this method to match the template's (ngSubmit) handler
  saveAddress(): void {
    this.onSubmit();
  }
}
