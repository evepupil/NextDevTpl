"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { CookieSettingsDialog } from "@/features/shared";

/**
 * Auth 页面底部组件
 *
 * 包含版权信息和法律链接
 * Cookie Settings 链接会打开设置对话框
 */
export function AuthFooter() {
  const t = useTranslations("Cookie");

  return (
    <footer className="border-t bg-background py-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
        <nav className="flex gap-6">
          <Link
            href="/legal/privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/legal/terms"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <CookieSettingsDialog>
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("title")}
            </button>
          </CookieSettingsDialog>
        </nav>
      </div>
    </footer>
  );
}
