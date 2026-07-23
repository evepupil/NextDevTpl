import { AdminSidebar } from "@/features/admin";
import { checkAdmin } from "@/lib/auth/admin";

/**
 * Admin 布局组件
 *
 * 功能:
 * - RBAC 权限检查 (只有 admin 角色可访问)
 * - Admin 专用侧边栏（永远深色，控制台调性）
 * - 内容区跟随用户主题，使用设计系统 token（不再硬编码 slate/white）
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 权限检查 - 非管理员会被重定向
  await checkAdmin();

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      <div className="pl-64">
        {/* Admin 顶栏 */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-6 backdrop-blur-xl">
          <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-destructive uppercase">
            ADMIN
          </span>
          <h1 className="text-lg font-semibold tracking-tight">管理后台</h1>
        </header>
        {/* 主内容区域 */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
