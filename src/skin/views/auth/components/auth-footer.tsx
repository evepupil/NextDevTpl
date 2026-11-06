"use client";

import { useTranslations } from "next-intl";

import { CookieSettingsDialog } from "@/components/ui/cookie-settings-dialog";
import { authSiteName } from "@/features/auth/view";
import { Link } from "@/i18n/routing";

export function AuthFooter() {
  const t = useTranslations("Auth.footer");

  return (
    <footer className="border-t bg-background py-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {t("copyright", {
            year: new Date().getFullYear(),
            name: authSiteName,
          })}
        </p>
        <nav className="flex gap-6">
          <Link
            href="/legal/privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/legal/terms"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("terms")}
          </Link>
          <CookieSettingsDialog>
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("cookies")}
            </button>
          </CookieSettingsDialog>
        </nav>
      </div>
    </footer>
  );
}
