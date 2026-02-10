"use client";

import { Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { useSidebar } from "@/features/dashboard/context";
import { cn } from "@/lib/utils";

/**
 * 从路径名获取页面标题翻译键
 */
function getPageTitleKey(pathname: string): string {
  const path = pathname.replace(/^\/[a-z]{2}\//, "/");
  const keyMap: Record<string, string> = {
    "/dashboard": "dashboard",
    "/dashboard/generate": "generate",
    "/dashboard/tasks": "tasks",
    "/dashboard/decks": "myDecks",
    "/dashboard/support": "support",
    "/dashboard/support/new": "newTicket",
    "/dashboard/settings": "settings",
    "/dashboard/settings/profile": "profile",
    "/dashboard/settings/security": "security",
    "/dashboard/settings/billing": "billing",
    "/dashboard/settings/notifications": "notifications",
  };

  // 精确匹配
  if (keyMap[path]) {
    return keyMap[path];
  }

  // 动态路由匹配 (如 /dashboard/decks/[id], /dashboard/support/[id])
  if (path.startsWith("/dashboard/decks/")) {
    return "deckDetails";
  }
  if (path.startsWith("/dashboard/support/")) {
    return "ticketDetails";
  }

  return "dashboard";
}

/**
 * Dashboard 主内容区域包装器
 *
 * 根据侧边栏折叠状态动态调整左边距
 * 内容区域为卡片样式，包含 Header 和内容
 */
export function DashboardMainWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations("Dashboard.pages");
  const pageTitleKey = getPageTitleKey(pathname);
  const pageTitle = t(pageTitleKey);

  return (
    <main
      className={cn(
        "p-2.5 min-h-screen transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64",
      )}
    >
      {/* 卡片容器 - Linear style: clean background, subtle border */}
      <div className="min-h-[calc(100vh-20px)] rounded-lg bg-background border border-border flex flex-col">
        {/* Header - 在卡片内部 */}
        <header className="flex h-12 items-center gap-3 border-b border-border px-4 shrink-0">
          {/* 移动端汉堡按钮 */}
          <button
            type="button"
            onClick={toggleMobile}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer md:hidden"
          >
            <Menu className="h-4 w-4 pointer-events-none" />
          </button>

          {/* 桌面端侧边栏折叠按钮 */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer md:flex"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4 pointer-events-none" />
            ) : (
              <PanelLeftClose className="h-4 w-4 pointer-events-none" />
            )}
          </button>

          {/* 分割线 - 与文字等高，淡色 */}
          <div className="h-4 w-px bg-border" />

          {/* 页面标题 */}
          <span className="text-sm font-medium text-foreground">{pageTitle}</span>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
