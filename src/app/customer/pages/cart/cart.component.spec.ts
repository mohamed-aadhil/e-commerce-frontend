import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CartPageComponent } from './cart';
import { CartService, Cart, CartItem } from '../../services/cart.service';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';

describe('CartPageComponent', () => {
  let component: CartPageComponent;
  let fixture: ComponentFixture<CartPageComponent>;
  let cartService: jasmine.SpyObj<CartService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: Router;

  const mockCart: Cart = {
    id: 1,
    is_guest: true,
    items: [
      {
        id: 1,
        product: {
          id: 1,
          title: 'Test Product',
          selling_price: 29.99,
          images: ['test.jpg'],
          inventory: { quantity: 10 }
        },
        quantity: 2,
        price: 29.99
      }
    ]
  };

  beforeEach(async () => {
    const cartServiceSpy = jasmine.createSpyObj('CartService', [
      'getCart',
      'addItem',
      'updateItem',
      'removeItem',
      'clearCart'
    ]);

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
      ],
      declarations: [CartPageComponent],
      providers: [
        { provide: CartService, useValue: cartServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        CurrencyPipe
      ]
    }).compileComponents();

    cartService = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router);

    // Mock getCart to return our test cart
    cartService.getCart.and.returnValue(of(mockCart));
    cartService.cart$ = of(mockCart);
    cartService.itemCount$ = of(2);

    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display cart items', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.item-title').textContent).toContain('Test Product');
    expect(compiled.querySelector('.item-price').textContent).toContain('29.99');
    expect(compiled.querySelector('.quantity').textContent).toContain('2');
  });

  it('should update quantity when clicking + button', () => {
    // Mock the updateItem response
    const updatedCart = { ...mockCart };
    updatedCart.items[0].quantity = 3;
    cartService.updateItem.and.returnValue(of(updatedCart));
    
    const addButton = fixture.nativeElement.querySelector('button[aria-label="Add one more"]');
    addButton.click();
    
    expect(cartService.updateItem).toHaveBeenCalledWith(1, 3);
  });

  it('should not allow quantity to exceed stock', () => {
    // Set up a cart item with quantity equal to stock
    const lowStockCart = {
      ...mockCart,
      items: [
        {
          ...mockCart.items[0],
          quantity: 10,
          product: {
            ...mockCart.items[0].product,
            inventory: { quantity: 10 }
          }
        }
      ]
    };
    
    // Re-create component with the low stock cart
    cartService.cart$ = of(lowStockCart);
    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    const addButton = fixture.nativeElement.querySelector('button[aria-label="Add one more"]');
    expect(addButton.disabled).toBeTrue();
  });

  it('should remove item when remove button is clicked', () => {
    cartService.removeItem.and.returnValue(of({
      ...mockCart,
      items: []
    }));
    
    const removeButton = fixture.nativeElement.querySelector('button[color="warn"]');
    removeButton.click();
    
    expect(cartService.removeItem).toHaveBeenCalledWith(1);
  });

  it('should display empty cart message when no items', () => {
    const emptyCart = { ...mockCart, items: [] };
    cartService.cart$ = of(emptyCart);
    
    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.empty-cart h2').textContent).toContain('Your cart is empty');
  });

  it('should display stock status correctly', () => {
    // Test in stock
    component.cart = mockCart;
    fixture.detectChanges();
    let stockStatus = fixture.nativeElement.querySelector('.stock-status');
    expect(stockStatus.textContent).toContain('In Stock');
    expect(stockStatus.classList).toContain('in-stock');
    
    // Test low stock
    const lowStockCart = {
      ...mockCart,
      items: [
        {
          ...mockCart.items[0],
          product: {
            ...mockCart.items[0].product,
            inventory: { quantity: 2 }
          }
        }
      ]
    };
    component.cart = lowStockCart;
    fixture.detectChanges();
    stockStatus = fixture.nativeElement.querySelector('.stock-status');
    expect(stockStatus.textContent).toContain('Only 2 left!');
    expect(stockStatus.classList).toContain('low-stock');
    
    // Test out of stock
    const outOfStockCart = {
      ...mockCart,
      items: [
        {
          ...mockCart.items[0],
          product: {
            ...mockCart.items[0].product,
            inventory: { quantity: 0 }
          }
        }
      ]
    };
    component.cart = outOfStockCart;
    fixture.detectChanges();
    stockStatus = fixture.nativeElement.querySelector('.stock-status');
    expect(stockStatus.textContent).toContain('Out of Stock');
    expect(stockStatus.classList).toContain('out-of-stock');
  });

  it('should handle errors when updating cart', () => {
    const error = new Error('Failed to update cart');
    cartService.updateItem.and.returnValue(throwError(() => error));
    
    const addButton = fixture.nativeElement.querySelector('button[aria-label="Add one more"]');
    addButton.click();
    
    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to update cart',
      'Dismiss',
      jasmine.any(Object)
    );
  });
});
