import { Routes } from '@angular/router';
import { Home } from './customer/pages/home/home';
import { GenreProducts } from './customer/pages/genre-products/genre-products';
import { ProductDetailsPage } from './customer/pages/product-details/product-details';
import { TestComponent } from './test/test.component';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  },
  {
    path: '',
    loadChildren: () => import('./customer/customer.routes').then(m => m.customerRoutes),
  },
  {
    path: 'test-session',
    component: TestComponent,
  },
  {
    path: 'auth',
    redirectTo: '/',
    pathMatch: 'full',
  },
  {
    path: 'auth/**',
    redirectTo: '/',
    pathMatch: 'full',
  },
];
