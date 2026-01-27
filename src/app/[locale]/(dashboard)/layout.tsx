import { DashboardSidebar, DashboardMainWrapper } from "@/features/dashboard/components";
import { SidebarProvider } from "@/features/dashboard/context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#f5f5f5]">
        <DashboardSidebar />
        <DashboardMainWrapper>{children}</DashboardMainWrapper>
      </div>
    </SidebarProvider>
  );
}
