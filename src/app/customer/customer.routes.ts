import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { GenreProducts } from './pages/genre-products/genre-products';
import { ProductDetailsPage } from './pages/product-details/product-details';

export const customerRoutes: Routes = [
  { path: '', component: Home },
  { path: 'genre/:id/products', component: GenreProducts },
  { path: 'product/:id', component: ProductDetailsPage },
]; 