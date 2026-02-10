"use client";

import {
  ArrowLeft,
  ChevronsUpDown,
  LogOut,
  Monitor,
  Moon,
  Sun,
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
import { adminConfig, siteConfig } from "@/config";
import { signOut, useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

/**
 * 主题类型
 */
type Theme = "light" | "dark" | "system";

/**
 * Admin 侧边栏组件
 *
 * 功能:
 * - Admin 专用导航菜单 (从配置读取)
 * - 用户信息弹出菜单
 * - 主题切换
 * - 返回用户端入口
 * - 登出功能
 *
 * 样式:
 * - 使用深色背景以区别于普通 Dashboard
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // 获取当前用户会话
  const { data: session } = useSession();
  const user = session?.user;

  // 主题状态 (简化版，实际应使用 next-themes)
  const [theme, setTheme] = useState<Theme>("system");

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

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-slate-900 text-slate-100">
      {/* Logo - Admin 标识 */}
      <div className="flex h-14 items-center border-b border-slate-700 px-4">
        <Link href="/admin" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <svg
            className="h-6 w-6 shrink-0 text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="17" rx="2" opacity="0.35" />
            <rect x="3" y="5" width="14" height="17" rx="2" />
            <path d="M7 18l3-8 3 8" />
            <path d="M8 16h4" />
          </svg>
          <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
            ADMIN
          </span>
          {siteConfig.name}
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {adminConfig.sidebarNav.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* 返回用户端链接 */}
        <div className="pt-4 border-t border-slate-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回用户端
          </Link>
        </div>
      </nav>

      {/* 用户信息区域 */}
      <div className="border-t border-slate-700 p-4">
        {user ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-800 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-red-600 text-white text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <span className="rounded bg-red-600/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                      Admin
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {user.email}
                  </p>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-slate-400" />
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
                  <AvatarFallback className="bg-red-600 text-white">
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

              {/* 主题切换 */}
              <div className="flex items-center justify-center gap-1 p-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                    theme === "light"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title="浅色模式"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                    theme === "dark"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title="深色模式"
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                    theme === "system"
                      ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title="跟随系统"
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>

              <Separator />

              {/* 菜单项 */}
              <div className="p-2">
                {/* 登出 */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // 加载状态
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
              <div className="h-3 w-32 animate-pulse rounded bg-slate-700" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
