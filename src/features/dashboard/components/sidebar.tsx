"use client";

import {
  ChevronsUpDown,
  LogOut,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { dashboardConfig, siteConfig } from "@/config";
import { CreditBalanceBadge } from "@/features/credits/components";
import { useSidebar } from "@/features/dashboard/context";
import { ModeToggle } from "@/features/shared/components";
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
  const { isCollapsed } = useSidebar();

  // 获取当前用户会话
  const { data: session } = useSession();
  const user = session?.user;

  // Popover 开关状态
  const [open, setOpen] = useState(false);

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

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#f5f5f5] transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <Link
          href="/dashboard"
          className={cn(
            "text-lg font-bold tracking-tight transition-opacity",
            isCollapsed && "opacity-0"
          )}
        >
          {siteConfig.name.toUpperCase()}
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {dashboardConfig.sidebarNav.map((group) => (
          <div key={group.title}>
            {/* Group Label - 折叠时隐藏 */}
            {!isCollapsed && (
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {!isCollapsed && item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 用户信息区域 */}
      <div className="border-t border-neutral-200 p-3">
        {user ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white/60 transition-colors",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-violet-600 text-white text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
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
                  <AvatarFallback className="bg-violet-600 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="font-medium">{user.name}</p>
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
                  Settings
                </button>

                {/* 登出 */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // 加载状态
          <div className={cn(
            "flex items-center gap-3 rounded-md px-2 py-1.5",
            isCollapsed && "justify-center px-0"
          )}>
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 space-y-1">
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
