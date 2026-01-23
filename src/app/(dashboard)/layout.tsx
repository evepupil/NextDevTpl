import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
