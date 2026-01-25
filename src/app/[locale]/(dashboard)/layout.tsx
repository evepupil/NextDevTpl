import { DashboardSidebar, DashboardTopbar } from "@/features/dashboard/components";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardTopbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
