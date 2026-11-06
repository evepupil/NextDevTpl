export interface OverviewCredits {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: readonly {
    id: string;
    type: string;
    description: string | null;
    amount: number;
    isIncome: boolean;
    createdAt: string;
  }[];
}

export interface OverviewPlan {
  planName: string;
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

export interface DashboardOverviewData {
  credits?: OverviewCredits;
  plan?: OverviewPlan;
}

export interface DashboardOverviewProviders {
  loadCredits?: (userId: string) => Promise<OverviewCredits>;
  loadPlan?: (userId: string) => Promise<OverviewPlan>;
}

export interface DashboardOverviewViewProps {
  locale: string;
  data: DashboardOverviewData;
}

export interface ViewContracts {
  "dashboard.overview": DashboardOverviewViewProps;
}
