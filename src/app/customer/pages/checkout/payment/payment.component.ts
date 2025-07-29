import { Component } from '@angular/core';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-payment',
  template: `
    <form (ngSubmit)="onPay()">
      <!-- payment fields here -->
      <button type="submit">Pay Now</button>
    </form>
  `
})
export class PaymentComponent {
  paymentData = {}; // fill with form data

  constructor(private paymentService: PaymentService) {}

  onPay() {
    this.paymentService.makePayment(this.paymentData).subscribe({
      next: (res: any) => { /* handle success */ },
      error: (err: any) => { /* handle error */ }
    });
  }
} 