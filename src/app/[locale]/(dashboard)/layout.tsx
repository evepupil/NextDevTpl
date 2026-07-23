import { redirect } from "next/navigation";
import { CreditBalanceBadge } from "@/features/credits";
import {
  DashboardMainWrapper,
  DashboardSidebar,
  SidebarProvider,
} from "@/features/dashboard";
import { CurrentPlanBadge } from "@/features/subscription";
import { getServerSession } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 服务端会话校验（防御纵深）
  // middleware 仅做 cookie 存在性检查（可被伪造），此处用 Better Auth 做
  // 真正的 DB 会话校验，确保所有 /dashboard 子页面都受到强制保护。
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/40">
        <DashboardSidebar
          compactAccountBadge={<CreditBalanceBadge />}
          accountPlanBadge={<CurrentPlanBadge />}
        />
        <DashboardMainWrapper>{children}</DashboardMainWrapper>
      </div>
    </SidebarProvider>
  );
}
