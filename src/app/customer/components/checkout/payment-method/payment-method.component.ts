import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

@Component({
  selector: 'app-payment-method',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './payment-method.component.html',
  styleUrls: ['./payment-method.component.css']
})
export class PaymentMethodComponent {
  @Input() paymentMethods: PaymentMethod[] = [];
  @Input() selectedMethod: string | null = null;
  @Input() isLoading = false;
  @Input() showTitle = true;
  @Input() showActions = false;
  
  @Output() methodSelected = new EventEmitter<string>();
  @Output() paymentSubmit = new EventEmitter<void>();
  
  paymentForm: FormGroup;
  
  constructor(private fb: FormBuilder, private router: Router) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['', Validators.required]
    });
  }
  
  ngOnChanges(): void {
    if (this.selectedMethod) {
      this.paymentForm.patchValue({
        paymentMethod: this.selectedMethod
      });
    }
  }
  
  onMethodSelect(methodId: string): void {
    this.methodSelected.emit(methodId);
  }
  
  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.paymentSubmit.emit();
    } else {
      this.paymentForm.markAllAsTouched();
    }
  }
  
  get selectedMethodData(): PaymentMethod | undefined {
    const methodId = this.paymentForm.get('paymentMethod')?.value;
    return this.paymentMethods.find(method => method.id === methodId);
  }
}
