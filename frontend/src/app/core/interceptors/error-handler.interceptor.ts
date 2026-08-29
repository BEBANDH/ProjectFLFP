import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        // Backend HTTP error response
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Invalid request parameters.';
            console.error('Validation Errors:', error.error?.fieldErrors);
            break;
          case 401:
            errorMessage = 'Session expired. Please log in again.';
            // TODO: Route to login
            break;
          case 404:
            errorMessage = error.error?.message || 'Requested resource not found.';
            break;
          case 500:
            errorMessage = 'Internal server error. Projection engine temporarily unavailable.';
            break;
          default:
            errorMessage = `Server Error (${error.status}): ${error.statusText}`;
        }
      }
      
      // In a real app, this would trigger a Toast/Snackbar service
      console.error('Error Intercepted:', errorMessage);
      
      return throwError(() => new Error(errorMessage));
    })
  );
};
