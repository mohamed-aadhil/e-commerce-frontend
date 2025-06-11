import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface RestockDialogData {
  productId: string;
  name: string;
  stock: number;
}

@Component({
  selector: 'app-restock-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, FormsModule],
  templateUrl: './restock-dialog.html',
  styleUrl: './restock-dialog.css'
})
export class RestockDialog {
  quantity: number | null = null;
  note: string = '';
  submitting = false;
  error: string = '';

  constructor(
    public dialogRef: MatDialogRef<RestockDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RestockDialogData
  ) {}

  onConfirm() {
    this.error = '';
    if (!this.quantity || this.quantity <= 0 || !Number.isInteger(this.quantity)) {
      this.error = 'Please enter a valid positive integer quantity.';
      return;
    }
    this.submitting = true;
    // Simulate async, or let parent handle actual restock
    this.dialogRef.close({ quantity: this.quantity, note: this.note });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
