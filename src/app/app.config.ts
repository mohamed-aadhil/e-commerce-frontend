import { ApplicationConfig,importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { RefreshInterceptor } from './auth/refresh.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatPaginatorModule } from '@angular/material/paginator';


import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([RefreshInterceptor])
    ),
    provideAnimations(),
    importProvidersFrom(MatPaginatorModule)
  ]

};
