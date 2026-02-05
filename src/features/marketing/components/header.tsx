"use client";

import { Blocks } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config";
import { Link } from "@/i18n/routing";
import { useSession } from "@/lib/auth/client";
import { LanguageSwitcher, ModeToggle } from "@/features/shared";

import { NavMenu } from "./nav-menu";

/**
 * Marketing 页面顶部导航栏
 *
 * 布局: [Logo + Nav 靠左] -------- [Actions 靠右]
 */
export function Header() {
  const t = useTranslations("Common");
  // 获取当前用户会话状态
  const { data: session, isPending } = useSession();
  const user = session?.user;

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* 左侧 - Logo + 导航菜单 */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Blocks className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>

          {/* 导航菜单 (桌面端) */}
          <div className="hidden md:flex">
            <NavMenu />
          </div>
        </div>

        {/* 右侧 - 操作区域 */}
        <div className="flex items-center gap-2">
          {/* 语言切换 */}
          <LanguageSwitcher />

          {/* 主题切换 */}
          <ModeToggle />

          {isPending ? (
            // 加载状态 - 显示骨架
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            // 已登录 - 显示 Dashboard 按钮和头像
            <>
              <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Link href="/dashboard">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-indigo-600 text-xs text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            // 未登录 - 显示登录和注册按钮
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
              >
                <Link href="/sign-in">{t("login")}</Link>
              </Button>
              <Button
                asChild
                className="bg-indigo-600 px-6 text-white hover:bg-indigo-700"
              >
                <Link href="/sign-up">{t("getStarted")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
