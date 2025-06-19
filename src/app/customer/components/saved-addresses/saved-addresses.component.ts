import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Address, AddressService } from '../../services/address.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AddressFormComponent } from '../checkout/address-form/address-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-saved-addresses',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './saved-addresses.component.html',
  styleUrls: ['./saved-addresses.component.css']
})
export class SavedAddressesComponent implements OnInit {
  @Input() selectable = false;
  @Output() addressSelected = new EventEmitter<Address>();
  @Output() defaultAddressChanged = new EventEmitter<number>();
  
  addresses: Address[] = [];
  selectedAddress: Address | null = null;
  loading = false;
  loadingAddressId: number | null = null;
  error: string | null = null;
  settingDefault = false;

  constructor(
    private addressService: AddressService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading = true;
    this.error = null;
    
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading addresses:', err);
        this.error = 'Failed to load addresses. Please try again.';
        this.loading = false;
      }
    });
  }

  onSelectAddress(address: Address): void {
    if (this.selectable) {
      this.selectedAddress = address;
      this.addressSelected.emit(address);
    }
  }

  onSetDefault(address: Address, event: Event): void {
    event.stopPropagation();
    if (address.isDefault) return;

    if (confirm('Set this as your default shipping address?')) {
      this.settingDefault = true;
      this.addressService.setDefaultAddress(address.id!).subscribe({
        next: () => {
          // Update the UI to reflect the new default
          this.addresses.forEach(addr => {
            addr.isDefault = (addr.id === address.id);
          });
          this.settingDefault = false;
          this.snackBar.open('Default address updated', 'Close', { duration: 3000 });
          this.defaultAddressChanged.emit(address.id);
        },
        error: (err) => {
          console.error('Error setting default address:', err);
          this.snackBar.open('Failed to update default address', 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
          this.settingDefault = false;
        }
      });
    }
  }

  openAddAddressDialog(): void {
    const dialogRef = this.dialog.open(AddressFormComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAddresses();
      }
    });
  }

  openEditAddressDialog(address: Address): void {
    const dialogRef = this.dialog.open(AddressFormComponent, {
      width: '600px',
      data: { address }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAddresses();
      }
    });
  }

  deleteAddress(addressId: number): void {
    if (confirm('Are you sure you want to delete this address?')) {
      this.addressService.deleteAddress(addressId).subscribe({
        next: () => {
          this.snackBar.open('Address deleted successfully', 'Close', { duration: 3000 });
          this.loadAddresses();
        },
        error: (err) => {
          console.error('Error deleting address:', err);
          this.snackBar.open('Failed to delete address', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Removed duplicate setAsDefault method as we already have onSetDefault for this purpose

  getDefaultAddress(): Address | undefined {
    return this.addresses.find(addr => addr.isDefault);
  }
}
