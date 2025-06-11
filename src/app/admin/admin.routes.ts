import { Routes } from '@angular/router';
import { InventoryDashboard } from './pages/inventory/inventory-dashboard';
import { AuthGuard } from '../auth/auth.guard';
import { AddBookComponent } from './pages/add-book/add-book.component';
import { AdminLayoutComponent } from './layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' },
    children: [
      { path: '', component: InventoryDashboard, pathMatch: 'full' },
      { path: 'books/add', component: AddBookComponent },
      { path: 'books/edit/:id', component: AddBookComponent },
    ]
  }
]; 