import { getUserPlan } from "./services/user-plan";

export async function getDashboardPlan(userId: string) {
  const userPlan = await getUserPlan(userId);

  return {
    planName: userPlan.planName,
    hasActiveSubscription: userPlan.hasActiveSubscription,
    cancelAtPeriodEnd: userPlan.cancelAtPeriodEnd,
    currentPeriodEnd: userPlan.currentPeriodEnd?.toISOString() ?? null,
  };
}
