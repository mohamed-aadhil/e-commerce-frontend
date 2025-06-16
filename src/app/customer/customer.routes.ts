// customer.routes.ts
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { GenreProducts } from './pages/genre-products/genre-products';
import { AudienceProducts } from './pages/audience-products/audience-products';
import { ProductDetailsPage } from './pages/product-details/product-details';
import { CartPageComponent } from './pages/cart/cart';

export const customerRoutes: Routes = [
  { path: '', component: Home },
  { path: 'genre/:id/products', component: GenreProducts },
  { path: 'audience/:id/products', component: AudienceProducts },
  { path: 'product/:id', component: ProductDetailsPage },
  { path: 'cart', component: CartPageComponent, title: 'Shopping Cart' },
];