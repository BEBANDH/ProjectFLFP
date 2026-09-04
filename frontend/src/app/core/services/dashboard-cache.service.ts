import { Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  DashboardSummaryResponse,
  FireSummaryResponse,
  GoalResponse
} from '../../shared/models/common-api.models';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const TTL_MS = 2 * 60 * 1000; // 2-minute cache

/**
 * DashboardCacheService
 *
 * Provides a thin, per-account TTL cache for the dashboard's heavy API calls.
 * - Cache hits return instantly as `of(data)` — no HTTP round trip.
 * - Cache is invalidated entirely when the active account changes.
 * - Write operations (create/update/delete) should call `invalidate()` so the
 *   next dashboard load fetches fresh data.
 */
@Injectable({ providedIn: 'root' })
export class DashboardCacheService {

  private cache = new Map<string, CacheEntry<any>>();
  private readonly api: ApiService;

  constructor(api: ApiService) {
    this.api = api;
  }

  /** Call after any write that changes account data */
  invalidate(): void {
    this.cache.clear();
  }

  /** Invalidate only entries belonging to a specific account */
  invalidateAccount(accountId: number): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${accountId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  getDashboardSummary(accountId: number): Observable<DashboardSummaryResponse> {
    return this.cached(
      `${accountId}:dashboard`,
      this.api.get<DashboardSummaryResponse>(`/api/v1/projections/dashboard-summary?accountId=${accountId}`)
    );
  }

  getFireSummary(accountId: number): Observable<FireSummaryResponse> {
    return this.cached(
      `${accountId}:fire`,
      this.api.get<FireSummaryResponse>(`/api/v1/projections/fire-summary?accountId=${accountId}`)
    );
  }

  getGoals(accountId: number): Observable<GoalResponse[]> {
    return this.cached(
      `${accountId}:goals`,
      this.api.get<GoalResponse[]>(`/api/v1/goals/account/${accountId}`)
    );
  }

  getCredits(accountId: number): Observable<any[]> {
    return this.cached(
      `${accountId}:credits`,
      this.api.get<any[]>(`/api/v1/credits/account/${accountId}`)
    );
  }

  getExpenses(accountId: number): Observable<any[]> {
    return this.cached(
      `${accountId}:expenses`,
      this.api.get<any[]>(`/api/v1/expenses/account/${accountId}`)
    );
  }

  getInvestments(accountId: number): Observable<any[]> {
    return this.cached(
      `${accountId}:investments`,
      this.api.get<any[]>(`/api/v1/investments/account/${accountId}`)
    );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private cached<T>(key: string, source$: Observable<T>): Observable<T> {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      return of(entry.data as T);
    }
    return source$.pipe(
      tap(data => this.cache.set(key, { data, expiresAt: Date.now() + TTL_MS }))
    );
  }
}
