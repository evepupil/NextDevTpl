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
import { getTranslations } from "next-intl/server";

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

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Column 1 */}
      <div className="space-y-6">
        <StatsChartCard
          title={t("page.stats.revenueTitle")}
          value="$15,231.89"
          change={t("page.stats.revenueChange")}
          changeType="positive"
          chartType="line"
          data={revenueData}
        />
        <StatsChartCard
          title={t("page.stats.subscriptionsTitle")}
          value="+2,350"
          change={t("page.stats.subscriptionsChange")}
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
