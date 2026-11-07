import { notFound } from "next/navigation";

import type { SupportDetailPageInput } from "@/core/support/contracts";
import {
  getSupportDetailViewData,
  getSupportListViewData,
} from "@/features/support/server";
import { redirect } from "@/i18n/routing";
import { skinViews } from "@/modules/skin-views";
import { getDashboardViewData, getWorkspaceSession } from "@/modules/view-data";

export async function DashboardPage({ locale }: { locale: string }) {
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const data = await getDashboardViewData(session.user.id);
  if (!data.credits) {
    const EmptyView = skinViews["shared.empty-dashboard"];
    return <EmptyView locale={locale} />;
  }
  const View = skinViews["dashboard.overview"];
  return <View locale={locale} data={data} />;
}

export async function SettingsPage({ locale }: { locale: string }) {
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const View = skinViews["settings.page"];
  return (
    <View
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}

export async function SupportListPage({ locale }: { locale: string }) {
  const session = await getWorkspaceSession();
  if (!session?.user) return redirect({ href: "/sign-in", locale });
  const data = await getSupportListViewData(session.user.id, locale);
  const View = skinViews["support.list"];
  return <View {...data} />;
}

export async function SupportDetailPage(input: SupportDetailPageInput) {
  const session = await getWorkspaceSession();
  if (!session?.user)
    return redirect({ href: "/sign-in", locale: input.locale });
  const data = await getSupportDetailViewData({
    ...input,
    userId: session.user.id,
  });
  if (!data) notFound();
  const View = skinViews["support.detail"];
  return <View {...data} />;
}
