// customer.routes.ts
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { GenreProducts } from './pages/genre-products/genre-products';
import { AudienceProducts } from './pages/audience-products/audience-products';
import { ProductDetailsPage } from './pages/product-details/product-details';
import { CartPageComponent } from './pages/cart/cart';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderConfirmationComponent } from './pages/order-confirmation/order-confirmation.component';

export const customerRoutes: Routes = [
  { path: '', component: Home },
  { path: 'genre/:id/products', component: GenreProducts },
  { path: 'audience/:id/products', component: AudienceProducts },
  { path: 'product/:id', component: ProductDetailsPage },
  { path: 'cart', component: CartPageComponent, title: 'Shopping Cart' },
  { 
    path: 'checkout', 
    component: CheckoutComponent, 
    title: 'Checkout',
    data: { animation: 'CheckoutPage' }
  },
  { 
    path: 'order-confirmation/:id', 
    component: OrderConfirmationComponent, 
    title: 'Order Confirmation',
    data: { animation: 'OrderConfirmationPage' }
  }
];