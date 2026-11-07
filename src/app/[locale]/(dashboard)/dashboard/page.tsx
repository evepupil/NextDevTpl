import { DashboardPage as DashboardPageView } from "@/modules/view-pages";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DashboardPageView locale={locale} />;
}
