import { HttpInterceptorFn } from '@angular/common/http';

export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  // Assuming Spring Boot is running on localhost:8080 during dev
  const apiUrl = 'http://localhost:8080';
  
  if (!req.url.startsWith('http')) {
    const prefixedReq = req.clone({
      url: `${apiUrl}${req.url}`
    });
    return next(prefixedReq);
  }
  
  return next(req);
};
