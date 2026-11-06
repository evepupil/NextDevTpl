import { redirect } from "@/i18n/routing";
import { getDashboardViewData, getWorkspaceSession } from "@/modules/view-data";
import { skinViews } from "@/modules/skin-views";

const DashboardView = skinViews["dashboard.overview"];
const EmptyDashboardView = skinViews["shared.empty-dashboard"];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale });

  const data = await getDashboardViewData(session.user.id);
  if (!data.credits) return <EmptyDashboardView locale={locale} />;

  return <DashboardView locale={locale} data={data} />;
}
