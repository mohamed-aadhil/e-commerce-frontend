import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { filter } from 'rxjs/operators';

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
    try {
      // Subscribe to router events for debugging
      this.router.events.pipe(
        filter(event => 
          event instanceof NavigationStart || 
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
      ).subscribe((event: Event) => {
        if (event instanceof NavigationStart) {
          console.log(`[Router] Navigation started to: ${event.url}`);
        } else if (event instanceof NavigationEnd) {
          console.log(`[Router] Navigation ended at: ${event.url}`);
        } else if (event instanceof NavigationCancel) {
          console.log(`[Router] Navigation cancelled: ${event.reason}`);
        } else if (event instanceof NavigationError) {
          console.error(`[Router] Navigation error:`, event.error);
        }
      });

      await this.authService.refreshToken();
      this.initialized = true;
      console.log('[App] Initialization complete');
    } catch (error) {
      console.error('[App] Error during initialization:', error);
    }
  }
}
