import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // The base URL will be prepended by the api-prefix interceptor
  constructor(private http: HttpClient) { }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(path, { params });
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(path, body);
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(path, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(path);
  }
}
