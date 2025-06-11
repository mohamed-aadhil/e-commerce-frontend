import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
// import { Header } from './customer/components/header/header';
// import { Footer } from './customer/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'frontend-app';
  initialized = false;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    await this.authService.refreshToken();
    this.initialized = true;
  }
}
