import { Routes } from '@angular/router';
import { InventoryDashboard } from '../pages/inventory/inventory-dashboard';
import { AuthGuard } from '../../auth/auth.guard';
import { AddBookComponent } from '../pages/inventory/add-book/add-book.component';
import { AdminLayoutComponent } from './layout.component';
import { ProductAnalyticsComponent } from '../pages/analytics/product-analytics.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      { path: '', redirectTo: 'inventory', pathMatch: 'full' },
      {
        path: 'inventory',
        children: [
          { path: '', component: InventoryDashboard, pathMatch: 'full' },
          { path: 'add', component: AddBookComponent },
          { path: 'edit/:id', component: AddBookComponent }
        ]
      },
      {
        path: 'analytics',
        children: [
          { path: '', redirectTo: 'products', pathMatch: 'full' },
          { path: 'products', component: ProductAnalyticsComponent }
        ]
      },
      { path: '**', redirectTo: 'inventory' }
    ]
  }
];