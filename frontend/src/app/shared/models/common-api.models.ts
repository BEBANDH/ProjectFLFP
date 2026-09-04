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

export interface FireSummaryResponse {
  accountId: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRatePercent: number;
  fireTargetNumber: number;
  currentPortfolioNestEgg: number;
  fireProgressPercent: number;
  fireCrossoverDate: string | null;
  isFireAchieved: boolean;
  calculatedAt: string;
}

export interface GoalResponse {
  id: number;
  accountId: number;
  goalName: string;
  targetAmount: number;
  targetDate: string;
  notes?: string;
  currentProjectedAmount: number;
  isOnTrack: boolean;
  createdAt: string;
}

export interface GoalCreateRequest {
  accountId: number;
  goalName: string;
  targetAmount: number;
  targetDate: string;
  notes?: string;
}

export interface GoalUpdateRequest {
  goalName: string;
  targetAmount: number;
  targetDate: string;
  notes?: string;
}

