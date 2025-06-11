import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminHeader } from './components/header/header';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [RouterModule, AdminHeader],
  template: `
    <admin-header></admin-header>
    <router-outlet></router-outlet>
  `
})
export class AdminLayoutComponent {} 