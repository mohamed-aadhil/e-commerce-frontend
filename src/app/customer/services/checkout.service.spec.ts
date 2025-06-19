import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CheckoutService, CheckoutRequest, OrderResponse } from './checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/v1';

  const mockCheckoutRequest: CheckoutRequest = {
    addressId: 1,
    shippingMethod: 'standard',
    paymentMethod: 'credit_card'
  };

  const mockOrderResponse: OrderResponse = {
    id: 1,
    status: 'pending_payment',
    total: 109.98,
    payment_status: 'pending',
    shipping_status: 'pending',
    created_at: new Date().toISOString(),
    items: [
      { id: 1, product_id: 101, product_name: 'Test Product', quantity: 2, price: 49.99 }
    ],
    shipping: {
      id: 1,
      shipping_method: 'standard',
      shipping_cost: 9.99,
      tracking_number: null,
      shipping_status: 'pending'
    },
    payment: {
      id: 1,
      payment_method: 'credit_card',
      payment_status: 'pending',
      amount: 109.98,
      transaction_id: null
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CheckoutService]
    });
    
    service = TestBed.inject(CheckoutService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkoutFromCart', () => {
    it('should send a POST request to the checkout endpoint', () => {
      service.checkoutFromCart(mockCheckoutRequest).subscribe(response => {
        expect(response).toEqual(mockOrderResponse);
      });

      const req = httpTestingController.expectOne(`${apiUrl}/cart/checkout`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(mockCheckoutRequest);
      
      req.flush(mockOrderResponse);
    });
  });

  describe('createDirectOrder', () => {
    it('should send a POST request to the orders endpoint', () => {
      service.createDirectOrder(mockCheckoutRequest).subscribe(response => {
        expect(response).toEqual(mockOrderResponse);
      });

      const req = httpTestingController.expectOne(`${apiUrl}/orders`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(mockCheckoutRequest);
      
      req.flush(mockOrderResponse);
    });
  });

  describe('getOrder', () => {
    it('should send a GET request to retrieve an order by ID', () => {
      const orderId = 1;
      
      service.getOrder(orderId).subscribe(response => {
        expect(response).toEqual(mockOrderResponse);
      });

      const req = httpTestingController.expectOne(`${apiUrl}/orders/${orderId}`);
      expect(req.request.method).toEqual('GET');
      
      req.flush(mockOrderResponse);
    });
  });

  describe('processPayment', () => {
    it('should send a POST request to process payment', () => {
      const orderId = 1;
      const mockResponse = { success: true, message: 'Payment processed' };
      
      service.processPayment(orderId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpTestingController.expectOne(`${apiUrl}/payments/${orderId}/process`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({});
      
      req.flush(mockResponse);
    });
  });

  describe('getShippingMethods', () => {
    it('should return available shipping methods', () => {
      const methods = service.getShippingMethods();
      expect(methods.length).toBeGreaterThan(0);
      const method = methods[0];
      expect(method.id).toBeDefined();
      expect(method.name).toBeDefined();
      expect(method.price).toBeDefined();
      expect(method.estimatedDays).toBeDefined();
    });
  });

  describe('getPaymentMethods', () => {
    it('should return available payment methods', () => {
      const methods = service.getPaymentMethods();
      expect(methods.length).toBeGreaterThan(0);
      const method = methods[0];
      expect(method.id).toBeDefined();
      expect(method.name).toBeDefined();
      expect(method.icon).toBeDefined();
    });
  });
});
