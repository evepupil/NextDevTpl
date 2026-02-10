"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { dashboardConfig } from "@/config";
import { CreditBalanceBadge } from "@/features/credits/components";
import { useSidebar } from "@/features/dashboard/context";
import { ModeToggle } from "@/features/shared/components";
import { getMyPlanAction } from "@/features/subscription/actions/get-user-plan";
import { PlanBadge, type PlanType } from "@/features/subscription/components/plan-badge";
import { signOut, useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

/**
 * Dashboard 侧边栏组件
 *
 * 功能:
 * - 导航菜单 (从配置读取)
 * - 用户信息弹出菜单
 * - 主题切换
 * - 设置入口
 * - 登出功能
 * - 支持折叠/展开
 */
export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const t = useTranslations("Dashboard");

  // 获取当前用户会话
  const { data: session } = useSession();
  const user = session?.user;

  // Popover 开关状态
  const [open, setOpen] = useState(false);

  // 获取用户订阅计划
  const { execute: fetchPlan, result: planResult } = useAction(getMyPlanAction);
  const userPlan = (planResult.data?.plan as PlanType) || "free";

  // 用户登录后获取计划
  useEffect(() => {
    if (user) {
      fetchPlan();
    }
  }, [user, fetchPlan]);

  /**
   * 导航项标题映射到翻译键
   */
  const getNavTitle = (title: string): string => {
    const titleMap: Record<string, string> = {
      "Dashboard": t("nav.dashboard"),
      "Support": t("nav.support"),
      "New Ticket": t("nav.newTicket"),
    };
    return titleMap[title] || title;
  };

  /**
   * 获取用户名首字母作为头像回退
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * 处理登出
   */
  const handleSignOut = async () => {
    setOpen(false);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  /**
   * 处理设置点击
   */
  const handleSettingsClick = () => {
    setOpen(false);
    router.push("/dashboard/settings");
  };

  /**
   * 渲染侧边栏内容（桌面和移动端共用）
   * mobile 参数控制是否为移动端模式（始终展开，点击关闭）
   */
  const renderSidebarContent = (mobile: boolean) => {
    const collapsed = mobile ? false : isCollapsed;

    return (
      <>
        {/* Logo */}
        <div className="flex h-14 items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => mobile && setMobileOpen(false)}
          >
            <svg
              className="h-6 w-6 shrink-0 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="2" y="2" width="9" height="9" rx="2" />
              <rect x="13" y="2" width="9" height="9" rx="2" opacity="0.5" />
              <rect x="2" y="13" width="9" height="9" rx="2" opacity="0.5" />
              <rect x="13" y="13" width="9" height="9" rx="2" />
            </svg>
            <span
              className={cn(
                "text-lg font-bold tracking-tight transition-opacity",
                collapsed && "opacity-0",
              )}
            >
              NextDev<span className="text-primary">Tpl</span>
            </span>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {dashboardConfig.sidebarNav.map((group) => (
            <div key={group.title}>
              {/* Group Label - 折叠时隐藏 */}
              {!collapsed && (
                <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {getNavTitle(group.title)}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  // 去掉 locale 前缀后比较路径
                  const normalizedPath = pathname.replace(/^\/[a-z]{2}\//, "/");
                  const isActive = normalizedPath === item.href ||
                    (item.href !== "/dashboard" && normalizedPath.startsWith(`${item.href}/`));
                  const Icon = item.icon;
                  const translatedTitle = getNavTitle(item.title);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? translatedTitle : undefined}
                      onClick={() => mobile && setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {!collapsed && (
                        <span className="flex-1">{translatedTitle}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 用户信息区域 */}
        <div className="border-t border-sidebar-border p-3">
          {user ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-1.5 hover:bg-sidebar-accent/50 transition-colors",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="flex-1 truncate text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{user.name}</p>
                          <CreditBalanceBadge />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </button>
              </PopoverTrigger>

              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-64 p-0"
              >
                {/* 用户信息头部 */}
                <div className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      <PlanBadge plan={userPlan} size="xs" />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 主题切换 - 使用共享 ModeToggle 组件 */}
                <div className="flex items-center justify-center p-3">
                  <ModeToggle variant="inline" />
                </div>

                <Separator />

                {/* 菜单项 */}
                <div className="p-2">
                  {/* 设置 */}
                  <button
                    type="button"
                    onClick={handleSettingsClick}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    {t("sidebar.settings")}
                  </button>

                  {/* 登出 */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("sidebar.logout")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            // 加载状态
            <div
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-1.5",
                collapsed && "justify-center px-0",
              )}
            >
              <div className="h-8 w-8 animate-pulse rounded-full bg-sidebar-accent shrink-0" />
              {!collapsed && (
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-20 animate-pulse rounded bg-sidebar-accent" />
                  <div className="h-3 w-32 animate-pulse rounded bg-sidebar-accent" />
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 md:flex",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 移动端 Sheet 侧边栏 */}
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 bg-sidebar p-0 md:hidden [&>button:last-child]:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            {renderSidebarContent(true)}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
