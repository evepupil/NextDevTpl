import type { DashboardLayoutViewProps } from "@/features/shared/view";
import { WorkspaceNavigation } from "./navigation";

export function DashboardLayoutView({
  mode,
  children,
}: DashboardLayoutViewProps) {
  if (mode !== "workspace") {
    return (
      <div
        className="min-h-screen"
        data-skin="contrast"
        data-skin-view="shared.dashboard-layout"
      >
        <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      data-skin="contrast"
      data-skin-view="shared.dashboard-layout"
    >
      <WorkspaceNavigation />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
