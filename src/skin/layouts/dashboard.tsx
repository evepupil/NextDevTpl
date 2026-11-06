import type { DashboardLayoutViewProps } from "@/features/shared/view";

import { DashboardMainWrapper } from "@/skin/views/shared/main-wrapper";
import { DashboardSidebar } from "@/skin/views/shared/sidebar";
import { SidebarProvider } from "@/skin/views/shared/sidebar-context";

export function DashboardLayoutView({
  mode,
  children,
}: DashboardLayoutViewProps) {
  if (mode !== "workspace") {
    return <main className="min-h-screen bg-muted/40 p-6">{children}</main>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/40">
        <DashboardSidebar />
        <DashboardMainWrapper>{children}</DashboardMainWrapper>
      </div>
    </SidebarProvider>
  );
}
