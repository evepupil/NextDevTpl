import type { DashboardOverviewData, DashboardOverviewProviders } from "./view";

export async function getDashboardOverviewData(
  userId: string,
  providers: DashboardOverviewProviders = {}
): Promise<DashboardOverviewData> {
  const [credits, plan] = await Promise.all([
    providers.loadCredits?.(userId),
    providers.loadPlan?.(userId),
  ]);

  return {
    ...(credits !== undefined && { credits }),
    ...(plan !== undefined && { plan }),
  };
}
