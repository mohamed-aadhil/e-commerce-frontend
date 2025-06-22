import { Routes } from '@angular/router';
import { InventoryDashboard } from '../pages/inventory/inventory-dashboard';
import { AuthGuard } from '../../auth/auth.guard';
import { AddBookComponent } from '../pages/inventory/add-book/add-book.component';
import { AdminLayoutComponent } from './layout.component';
import { ProductAnalyticsComponent } from '../pages/analytics/product-analytics.component';
import { InventoryAnalyticsComponent } from '../pages/analytics/inventory-analytics.component';
import { AnalyticsComponent } from '../pages/analytics/analytics.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      { path: '', redirectTo: 'analytics', pathMatch: 'full' },
      {
        path: 'analytics',
        component: AnalyticsComponent,
        children: [
          { path: '', redirectTo: 'products', pathMatch: 'full' },
          { path: 'products', component: ProductAnalyticsComponent },
          { path: 'inventory', component: InventoryAnalyticsComponent },
          // Add more analytics tabs here as needed
        ]
      },
      {
        path: 'inventory',
        children: [
          { path: '', component: InventoryDashboard, pathMatch: 'full' },
          { path: 'add', component: AddBookComponent },
          { path: 'edit/:id', component: AddBookComponent }
        ]
      },
      { path: '**', redirectTo: 'analytics' }
    ]
  }
];