import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedHeader } from '../shared/header/header';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [RouterModule, SharedHeader],
  template: `
    <app-shared-header></app-shared-header>
    <router-outlet></router-outlet>
  `
})
export class AdminLayoutComponent {} 