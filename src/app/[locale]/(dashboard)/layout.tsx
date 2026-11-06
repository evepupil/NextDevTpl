import type { ReactNode } from "react";

import { redirect } from "@/i18n/routing";
import { getWorkspaceSession, workspaceMode } from "@/modules/view-data";
import { skinViews } from "@/modules/skin-views";

const View = skinViews["shared.dashboard-layout"];

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (workspaceMode !== "public") {
    const session = await getWorkspaceSession();
    if (!session?.user) redirect({ href: "/sign-in", locale });
  }

  return <View mode={workspaceMode}>{children}</View>;
}
