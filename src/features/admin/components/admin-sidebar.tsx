"use client";

import { ArrowLeft, ChevronsUpDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { adminConfig, siteConfig } from "@/config";
import { ModeToggle } from "@/features/shared";
import { signOut, useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

/**
 * Admin 侧边栏组件
 *
 * 根节点挂 `dark` class，让所有 token 类强制解析为暗色值——侧栏永远是
 * 深色"控制台"调性，与跟随主题的主内容区形成区分（管理后台的视觉信号）。
 * 红色（destructive）用于 ADMIN 标识，呼应"管理 = 需谨慎"的语义。
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("AdminSidebar");

  const getNavTitle = (title: string, translationKey?: string) =>
    translationKey ? t(translationKey) : title;

  const { data: session } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

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
    <aside className="dark fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo - Admin 标识 */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative logo */}
        <svg
          className="h-6 w-6 shrink-0 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17 L9 7 L13 14 L21 4" />
          <circle cx="9" cy="7" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="21" cy="4" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        <span className="text-base font-bold tracking-tight">
          {siteConfig.name}
        </span>
        <span className="rounded bg-destructive px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-white">
          {t("badge")}
        </span>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {adminConfig.sidebarNav.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/40 uppercase">
              {getNavTitle(group.title, group.translationKey)}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname.endsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {getNavTitle(item.title, item.translationKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* 返回用户端链接 */}
        <div className="border-t border-sidebar-border pt-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("returnToUser")}
          </Link>
        </div>
      </nav>

      {/* 用户信息区域 */}
      <div className="border-t border-sidebar-border p-3">
        {user ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent/50"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-destructive text-xs text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <span className="rounded bg-destructive/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-destructive">
                      {t("roleBadge")}
                    </span>
                  </div>
                  <p className="truncate text-xs text-sidebar-foreground/50">
                    {user.email}
                  </p>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-64 p-0"
            >
              <div className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-destructive text-white">
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

              {/* 主题切换 - 用共享 ModeToggle，真正生效 */}
              <div className="flex items-center justify-center p-3">
                <ModeToggle variant="inline" />
              </div>

              <Separator />

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                  {t("signOut")}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          // 加载状态
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="h-8 w-8 animate-pulse rounded-full bg-sidebar-accent" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-20 animate-pulse rounded bg-sidebar-accent" />
              <div className="h-3 w-32 animate-pulse rounded bg-sidebar-accent" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
