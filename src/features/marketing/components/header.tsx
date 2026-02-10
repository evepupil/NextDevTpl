"use client";

import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { mainNav, productsNav } from "@/config/nav";
import { Link } from "@/i18n/routing";
import { useSession } from "@/lib/auth/client";
import { LanguageSwitcher, ModeToggle } from "@/features/shared";

import { NavMenu } from "./nav-menu";

/**
 * Products 下拉菜单翻译映射 key (移动端复用)
 */
const productsTitleMap: Record<string, string> = {
  Core: "productsMenu.core.title",
  "DX Platform": "productsMenu.dx.title",
  Infrastructure: "productsMenu.infra.title",
  Authentication: "productsMenu.core.auth",
  Payments: "productsMenu.core.payments",
  Credits: "productsMenu.core.credits",
  "Background Jobs": "productsMenu.dx.jobs",
  Internationalization: "productsMenu.dx.i18n",
  "AI Integration": "productsMenu.dx.ai",
  "Admin Panel": "productsMenu.infra.admin",
  "File Storage": "productsMenu.infra.storage",
  Monitoring: "productsMenu.infra.monitoring",
};

/**
 * Marketing 页面顶部导航栏
 *
 * 布局: [Logo + Nav 靠左] -------- [Actions 靠右]
 */
export function Header() {
  // 获取当前用户会话状态
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const t = useTranslations("Header");
  const tNav = useTranslations("Navigation");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(false);

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
   * 导航项标题翻译映射
   */
  const navTitleMap: Record<string, string> = {
    Products: tNav("products"),
    Docs: tNav("docs"),
    Pricing: tNav("pricing"),
    Blog: tNav("blog"),
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* 左侧 - Logo + 导航菜单 */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg
              className="h-6 w-6 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="2" y="2" width="9" height="9" rx="2" />
              <rect
                x="13"
                y="2"
                width="9"
                height="9"
                rx="2"
                opacity="0.5"
              />
              <rect
                x="2"
                y="13"
                width="9"
                height="9"
                rx="2"
                opacity="0.5"
              />
              <rect x="13" y="13" width="9" height="9" rx="2" />
            </svg>
            <span className="text-xl font-bold tracking-tight">
              NextDev<span className="text-primary">Tpl</span>
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
            <div className="hidden h-9 w-24 animate-pulse rounded-md bg-muted md:block" />
          ) : user ? (
            // 已登录 - 显示 Dashboard 按钮和头像
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden text-muted-foreground md:inline-flex"
              >
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <Link href="/dashboard" className="hidden md:block">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            // 未登录 - 显示登录和注册按钮（桌面端）
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
              >
                <Link href="/sign-in">{t("login")}</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/sign-up">{t("getStarted")}</Link>
              </Button>
            </>
          )}

          {/* 移动端汉堡按钮 */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 移动端导航 Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            {/* 导航链接 */}
            <nav className="flex-1 overflow-y-auto px-4 pt-12">
              {/* Products 可折叠区域 */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setProductsExpanded(!productsExpanded)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                >
                  {navTitleMap.Products}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${productsExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {productsExpanded && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    {productsNav.map((group) => (
                      <div key={group.title} className="py-1">
                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {tNav(
                            productsTitleMap[group.title] || group.title,
                          )}
                        </div>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.title}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                            >
                              <Icon className="h-3.5 w-3.5 text-primary" />
                              {tNav(
                                productsTitleMap[item.title] || item.title,
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 主导航链接 */}
              <div className="space-y-1">
                {mainNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                  >
                    {navTitleMap[item.title] || item.title}
                  </Link>
                ))}
              </div>
            </nav>

            {/* 底部操作按钮 */}
            <div className="border-t border-border p-4 space-y-2">
              {user ? (
                <Button asChild className="w-full">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t("dashboard")}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href="/sign-in"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("login")}
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link
                      href="/sign-up"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("getStarted")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
