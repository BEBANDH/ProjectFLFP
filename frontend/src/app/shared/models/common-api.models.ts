export interface AccountResponse {
  id: number;
  userId: number;
  accountName: string;
  bankName: string;
  currentBalance: number;
  createdAt: string;
}

export interface DashboardSummaryResponse {
  accountId: number;
  currentBalance: number;
  projectedBalance30Days: number;
  projectedBalance1Year: number;
  calculatedAt: string;
}

export interface ProjectionResponse {
  accountId: number;
  targetDate: string;
  projectedBalance: number;
  deltaVariance: number;
  calculatedAt: string;
}
