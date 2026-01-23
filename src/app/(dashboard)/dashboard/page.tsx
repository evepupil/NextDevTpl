import {
  AuthCard,
  CookieSettingsCard,
  ExerciseChartCard,
  GoalCard,
  RepoCard,
  ShareDocumentCard,
  StatsChartCard,
  SubscriptionFormCard,
} from "@/features/dashboard/components";

const revenueData = [
  { value: 100 },
  { value: 120 },
  { value: 115 },
  { value: 140 },
  { value: 135 },
  { value: 160 },
  { value: 155 },
  { value: 180 },
  { value: 175 },
  { value: 200 },
  { value: 220 },
  { value: 210 },
];

const subscriptionData = [
  { value: 50 },
  { value: 80 },
  { value: 70 },
  { value: 110 },
  { value: 100 },
  { value: 140 },
  { value: 130 },
  { value: 170 },
  { value: 180 },
  { value: 200 },
  { value: 220 },
  { value: 250 },
];

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Column 1 */}
      <div className="space-y-6">
        <StatsChartCard
          title="Total Revenue"
          value="$15,231.89"
          change="+20.1% from last month"
          changeType="positive"
          chartType="line"
          data={revenueData}
        />
        <StatsChartCard
          title="Subscriptions"
          value="+2,350"
          change="+180.1% from last month"
          changeType="positive"
          chartType="area"
          data={subscriptionData}
        />
        <GoalCard />
      </div>

      {/* Column 2 */}
      <div className="space-y-6">
        <SubscriptionFormCard />
        <AuthCard />
      </div>

      {/* Column 3 */}
      <div className="space-y-6">
        <RepoCard />
        <CookieSettingsCard />
        <ExerciseChartCard />
        <ShareDocumentCard />
      </div>
    </div>
  );
}
