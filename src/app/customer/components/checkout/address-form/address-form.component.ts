import { Component, Inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/** Error when invalid control is dirty, touched, or submitted. */
class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Address, AddressService } from '../../../services/address.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.css']
})
export class AddressFormComponent implements OnInit {
  addressForm: FormGroup;
  isEditMode = false;
  matcher = new MyErrorStateMatcher();
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private dialogRef: MatDialogRef<AddressFormComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { address?: Address }
  ) {
    this.isEditMode = !!data?.address;
    
    this.addressForm = this.fb.group({
      recipientName: ['', [Validators.required, Validators.maxLength(100)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      addressLine1: ['', [Validators.required, Validators.maxLength(255)]],
      addressLine2: ['', Validators.maxLength(255)],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.maxLength(100)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5,10}$/)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.address) {
      this.populateForm(this.data.address);
    }
  }

  populateForm(address: Address): void {
    this.addressForm.patchValue({
      recipientName: address.recipientName,
      mobileNumber: address.mobileNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault || false
    });
  }

  onSubmit(): void {
    if (this.addressForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Map form values to match the Address interface
    const formValue = this.addressForm.value;
    const addressData: Partial<Address> = {
      recipientName: formValue.recipientName,
      mobileNumber: formValue.mobileNumber,
      addressLine1: formValue.addressLine1,
      addressLine2: formValue.addressLine2 || '',
      city: formValue.city,
      state: formValue.state,
      postalCode: formValue.postalCode,
      country: formValue.country,
      isDefault: formValue.isDefault || false
    };

    let request: Observable<Address>;
    if (this.isEditMode && this.data.address?.id) {
      // Ensure we have a valid ID before making the update call
      const addressId = this.data.address.id;
      if (addressId) {
        request = this.addressService.updateAddress(addressId, addressData);
      } else {
        this.error = 'Invalid address ID';
        this.loading = false;
        return;
      }
    } else {
      request = this.addressService.createAddress(addressData);
    }

    request.subscribe({
      next: (result: Address) => {
        this.loading = false;
        this.snackBar.open(
          this.isEditMode ? 'Address updated successfully' : 'Address added successfully',
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(result);
      },
      error: (error: any) => {
        console.error('Error saving address:', error);
        this.loading = false;
        this.error = error.error?.message || 'Failed to save address. Please try again.';
        this.snackBar.open(this.error || 'An unknown error occurred', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Helper method to check if a form field is invalid
  isFieldInvalid(field: string): boolean {
    const control = this.addressForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  // Helper method to get error message for a field
  getErrorMessage(field: string): string {
    const control = this.addressForm.get(field);
    
    if (!control?.errors) {
      return '';
    }
    
    const errors = control.errors;
    
    if (errors['required']) {
      return 'This field is required';
    } else if (errors['email']) {
      return 'Please enter a valid email';
    } else if (errors['pattern']) {
      if (field === 'mobileNumber') {
        return 'Please enter a valid phone number (10-15 digits)';
      } else if (field === 'postalCode') {
        return 'Please enter a valid postal code (5-10 digits)';
      }
      return 'Invalid format';
    } else if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `Minimum length is ${minLength} characters`;
    } else if (errors['maxlength']) {
      const maxLength = errors['maxlength'].requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    
    return '';
  }
}
