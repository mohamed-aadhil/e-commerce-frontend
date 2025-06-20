import { Routes } from '@angular/router';
import { TestComponent } from './test/test.component';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/layout/admin.routes').then(m => m.adminRoutes),
  },
  {
    path: '',
    loadChildren: () => import('./customer/customer.routes').then(m => m.customerRoutes),
  },
  {
    path: 'test-session',
    component: TestComponent,
  },
  // Redirect any unmatched routes to home
  { path: '**', redirectTo: '' }
];
