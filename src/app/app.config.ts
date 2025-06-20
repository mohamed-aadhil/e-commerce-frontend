import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { RefreshInterceptor } from './auth/refresh.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatPaginatorModule } from '@angular/material/paginator';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptor as CustomHttpInterceptor } from './core/interceptors/http.interceptor';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { AuthService } from './auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    AuthService,
    provideHttpClient(
      withInterceptors([RefreshInterceptor]),
      withInterceptorsFromDi()
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CustomHttpInterceptor,
      multi: true
    },
    provideAnimations(),
    importProvidersFrom(MatPaginatorModule),
    // Register charts with default registerables and additional plugins
    provideCharts(
      withDefaultRegisterables(),
      {
        // Register the datalabels plugin globally
        type: 'doughnut',
        options: {
          plugins: {
            datalabels: {
              display: true,
              color: '#fff',
              font: {
                weight: 'bold',
                size: 12
              },
              formatter: (value: number, context: any) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return percentage > 5 ? `${percentage}%` : '';
              }
            }
          }
        }
      } as any
    )
  ]
};
