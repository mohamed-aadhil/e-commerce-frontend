import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CartService, Cart, CartItem as CartServiceCartItem } from '../../services/cart.service';
import { Address, AddressService } from '../../services/address.service';
import { CheckoutService, CheckoutRequest } from '../../services/checkout.service';
import { OrderSummaryData } from '../../components/checkout/order-summary/order-summary.component';
import { SavedAddressesComponent } from '../../components/saved-addresses/saved-addresses.component';
import { OrderSummaryComponent } from '../../components/checkout/order-summary/order-summary.component';
import { PaymentMethodComponent } from '../../components/checkout/payment-method/payment-method.component';
import { AddAddressDialogComponent } from '../../components/add-address-dialog/add-address-dialog.component';
import { CartItem as OrderSummaryCartItem } from '../../models/cart.model';

type CombinedCartItem = CartServiceCartItem & {
  product: CartServiceCartItem['product'] & {
    name: string;
    price: number;
    image_url: string;
  }
};

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    RouterModule,
    SavedAddressesComponent,
    OrderSummaryComponent,
    PaymentMethodComponent
    // Removed AddAddressDialogComponent as it's only used with MatDialog
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper?: MatStepper;
  
  // Track current step (0: shipping, 1: payment, 2: review)
  currentStep = 0;

  // Form groups
  addressForm: FormGroup;
  paymentForm: FormGroup;

  // Data
  cartItems: CombinedCartItem[] = [];
  addresses: Address[] = [];
  selectedAddress: Address | null = null;

  // Order summary
  orderSummary: OrderSummaryData = {
    items: [],
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  };

  // Shipping and payment methods
  shippingMethods: Array<{
    id: 'standard' | 'express' | 'overnight';
    name: string;
    price: number;
    estimatedDays: string;
  }> = [
    { id: 'standard', name: 'Standard Shipping', price: 4.99, estimatedDays: '3-5 business days' },
    { id: 'express', name: 'Express Shipping', price: 9.99, estimatedDays: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 19.99, estimatedDays: '1 business day' }
  ];
  
  paymentMethods: Array<{id: string, name: string, icon: string}> = [
    { id: 'credit_card', name: 'Credit Card', icon: 'credit_card' },
    { id: 'debit_card', name: 'Debit Card', icon: 'credit_card' },
    { id: 'paypal', name: 'PayPal', icon: 'payments' },
    { id: 'wallet', name: 'Wallet', icon: 'account_balance_wallet' }
  ];
  
  // UI State
  isLoading = true;
  isProcessing = false;
  shippingMethod: 'standard' | 'express' | 'overnight' = 'standard';
  paymentMethod: string = 'credit_card';
  selectedPaymentMethod: string = 'credit_card';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private addressService: AddressService,
    private checkoutService: CheckoutService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {
    // Initialize forms
    this.addressForm = this.fb.group({
      addressId: ['', Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['credit_card', Validators.required],
      savePaymentMethod: [false]
    });
  }

  ngOnInit(): void {
    this.loadCartItems();
    this.loadAddresses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load cart items
  private loadCartItems(): void {
    this.isLoading = true;
    this.cartService.cart$
      .pipe(
        filter(cart => cart !== null), // Skip initial null value
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (cart: Cart | null) => {
          if (!cart) {
            this.cartItems = [];
            this.updateOrderSummary();
            this.isLoading = false;
            return;
          }

          console.log('Cart loaded in checkout:', cart);
          
          // Map cart items to CombinedCartItem type
          this.cartItems = (cart.items || []).map(item => ({
            ...item,
            product: {
              ...item.product,
              name: item.product?.title || 'Unknown Product',
              price: item.product?.selling_price || 0,
              image_url: item.product?.images?.[0] || 'assets/images/placeholder-product.png'
            }
          }));
          
          this.updateOrderSummary();
          this.isLoading = false;
          
          // If cart is empty, show a message and redirect back to cart
          if (this.cartItems.length === 0) {
            this.snackBar.open('Your cart is empty', 'OK', { duration: 3000 });
            this.router.navigate(['/cart']);
          }
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          this.isLoading = false;
          this.snackBar.open('Failed to load cart. Please try again.', 'Close', { duration: 3000 });
        }
      });
  }

  // Load user addresses
  private loadAddresses(): void {
    this.isLoading = true;
    this.addressService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses: Address[]) => {
          this.addresses = addresses || [];
          
          // If no addresses, open the add address dialog
          if (this.addresses.length === 0) {
            this.snackBar.open('Please add a shipping address', 'OK', { duration: 3000 });
            this.openAddAddressDialog();
          } else {
            // Select the default address or the first one
            const defaultAddress = this.addresses.find(addr => addr.isDefault) || this.addresses[0];
            if (defaultAddress) {
              this.selectedAddress = defaultAddress;
              this.addressForm.patchValue({ addressId: defaultAddress.id });
            }
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading addresses:', error);
          if (error.status === 404) {
            // No addresses found, open add address dialog
            this.addresses = [];
            this.snackBar.open('Please add a shipping address', 'OK', { duration: 3000 });
            this.openAddAddressDialog();
          } else {
            this.snackBar.open('Failed to load addresses. Please try again.', 'Close', { duration: 3000 });
          }
          this.isLoading = false;
        }
      });
  }

  // Update order summary
  private updateOrderSummary(): void {
    if (!this.cartItems.length) return;
    
    // Calculate subtotal from cart items
    const subtotal = this.cartItems.reduce(
      (sum: number, item: CombinedCartItem) => sum + (item.product.price * item.quantity), 
      0
    );
    
    // Get shipping cost based on selected method
    const shippingMethod = this.shippingMethods.find(m => m.id === this.shippingMethod);
    const shipping = shippingMethod ? shippingMethod.price : 0;
    
    // Calculate tax (for now, we'll set it to 0, can be calculated based on location later)
    const tax = 0;
    
    // Map cart items to match the expected OrderSummaryData.items type
    const orderItems: OrderSummaryCartItem[] = this.cartItems.map(item => ({
      id: item.id,
      product_id: item.product.id,
      product: {
        ...item.product,
        description: '',
        category_id: 0,
        stock_quantity: item.quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      quantity: item.quantity
    }));
    
    // Update order summary with cart items
    this.orderSummary = {
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    };
  }

  // Handle address selection
  onAddressSelected(address: Address): void {
    this.selectedAddress = address;
    this.addressForm.patchValue({ addressId: address.id });
  }

  // Handle shipping method change
  onShippingMethodChange(method: 'standard' | 'express' | 'overnight'): void {
    this.shippingMethod = method;
    this.updateOrderSummary();
  }

  // Handle payment method selection
  onPaymentMethodSelected(methodId: string): void {
    this.selectedPaymentMethod = methodId;
    this.paymentMethod = methodId;
    this.paymentForm.patchValue({ paymentMethod: methodId });
  }

  // Get shipping method display name
  getShippingMethodName(method: string): string {
    const shippingMethod = this.shippingMethods.find(m => m.id === method);
    return shippingMethod ? shippingMethod.name : 'Standard';
  }

  // Get estimated delivery
  getEstimatedDelivery(method: string): string {
    const shippingMethod = this.shippingMethods.find(m => m.id === method);
    return shippingMethod ? shippingMethod.estimatedDays : '3-5 business days';
  }

  // Get payment method display name
  getPaymentMethodName(method: string): string {
    const paymentMethod = this.paymentMethods.find(m => m.id === method);
    return paymentMethod ? paymentMethod.name : 'Credit Card';
  }

  // Open add address dialog
  openAddAddressDialog(): void {
    const dialogRef = this.dialog.open(AddAddressDialogComponent, {
      width: '500px',
      data: { userId: this.route.snapshot.paramMap.get('id') }
    });

    dialogRef.afterClosed().subscribe((result: Address) => {
      if (result) {
        // Reload addresses to get the latest list from the server
        this.loadAddresses();
        
        // Show success message
        this.snackBar.open('Address added successfully', 'OK', { duration: 3000 });
      }
    });
  }

  // Get shipping methods for the dropdown
  getShippingMethods() {
    return this.shippingMethods;
  }
  
  // Navigate to next step
  nextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }
  
  // Navigate to previous step
  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Handle address form submission
  onAddressSubmit(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.currentStep = 1; // Move to payment step
  }
  
  // Handle payment form submission
  onPaymentSubmit(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    
    if (!this.selectedAddress?.id) {
      this.snackBar.open('Please select a shipping address', 'OK', { duration: 3000 });
      this.currentStep = 0; // Go back to address step
      return;
    }
    
    if (!this.paymentMethod) {
      this.snackBar.open('Please select a payment method', 'OK', { duration: 3000 });
      this.currentStep = 1;
      return;
    }

    this.placeOrder();
  }
  
  // Place the order
  placeOrder(): void {
    if (!this.selectedAddress?.id) {
      this.snackBar.open('Please select a shipping address', 'OK', { duration: 3000 });
      this.currentStep = 0;
      return;
    }

    if (!this.paymentMethod) {
      this.snackBar.open('Please select a payment method', 'OK', { duration: 3000 });
      this.currentStep = 1;
      return;
    }

    this.isProcessing = true;

    const checkoutData: CheckoutRequest = {
      addressId: this.selectedAddress.id,
      shippingMethod: this.shippingMethod,
      paymentMethod: this.paymentMethod as 'credit_card' | 'debit_card' | 'paypal' | 'wallet',
      
    };
    
    this.checkoutService.checkoutFromCart(checkoutData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.isProcessing = false;
          // Clear cart on successful order
          this.cartService.clearCart().subscribe();
          this.router.navigate(['/order-confirmation', order.id]);
        },
        error: (err) => {
          console.error('Error placing order:', err);
          this.snackBar.open(
            err.error?.message || 'Failed to place order. Please try again.',
            'Close',
            { duration: 5000 }
          );
          this.isProcessing = false;
        }
      });
  }
  
  // Go back to cart
  goBack(): void {
    this.router.navigate(['/cart']);
  }
  
  // Track by function for ngFor
  trackByItemId(index: number, item: any): number {
    return item.id;
  }
}
