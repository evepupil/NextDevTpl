"use client";

import { PanelLeftClose, PanelLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { usePathname } from "@/i18n/routing";
import { useSidebar } from "@/features/dashboard/context";
import { cn } from "@/lib/utils";

/**
 * 从路径名获取页面标题
 */
function getPageTitle(pathname: string, t: (key: string) => string): string {
  const path = pathname.replace(/^\/[a-z]{2}\//, "/");
  const titleMap: Record<string, string> = {
    "/dashboard": t("mainTitle.dashboard"),
    "/dashboard/chat": t("mainTitle.chat"),
    "/dashboard/image": t("mainTitle.image"),
    "/dashboard/settings": t("mainTitle.settings"),
    "/dashboard/settings/profile": t("mainTitle.profile"),
    "/dashboard/settings/security": t("mainTitle.security"),
    "/dashboard/settings/billing": t("mainTitle.billing"),
    "/dashboard/settings/notifications": t("mainTitle.notifications"),
  };
  return titleMap[path] ?? t("mainTitle.dashboard");
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
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations("Dashboard");
  const pageTitle = getPageTitle(pathname, t);

  return (
    <main
      className={cn(
        "p-2.5 min-h-screen transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}
    >
      {/* 卡片容器 - #f8f8f8 背景，圆角，边缘阴影 */}
      <div className="min-h-[calc(100vh-20px)] rounded-[10px] bg-[#f8f8f8] shadow-[0_0_8px_rgba(0,0,0,0.06)] flex flex-col">
        {/* Header - 在卡片内部 */}
        <header className="flex h-14 items-center gap-3 border-b border-neutral-100 px-4 shrink-0">
          {/* 侧边栏折叠按钮 */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4 pointer-events-none" />
            ) : (
              <PanelLeftClose className="h-4 w-4 pointer-events-none" />
            )}
          </button>

          {/* 分割线 - 与文字等高，淡色 */}
          <div className="h-4 w-px bg-neutral-200" />

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
