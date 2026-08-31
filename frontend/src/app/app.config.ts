import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';
import { errorHandlerInterceptor } from './core/interceptors/error-handler.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        apiPrefixInterceptor,
        authInterceptor,
        errorHandlerInterceptor
      ])
    )
  ]
};
