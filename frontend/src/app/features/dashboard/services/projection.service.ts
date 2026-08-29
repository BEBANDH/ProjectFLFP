import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummaryResponse, ProjectionResponse } from '../../../shared/models/common-api.models';

@Injectable({
  providedIn: 'root'
})
export class ProjectionService {

  constructor(private api: ApiService) { }

  getDashboardSummary(accountId: number): Observable<DashboardSummaryResponse> {
    const params = new HttpParams().set('accountId', accountId.toString());
    return this.api.get<DashboardSummaryResponse>('/api/v1/projections/dashboard-summary', params);
  }

  calculateProjection(accountId: number, targetDate: string): Observable<ProjectionResponse> {
    const params = new HttpParams()
      .set('accountId', accountId.toString())
      .set('targetDate', targetDate);
      
    return this.api.get<ProjectionResponse>('/api/v1/projections/calculate-date', params);
  }
}
