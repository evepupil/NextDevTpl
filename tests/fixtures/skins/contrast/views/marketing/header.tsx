"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CookieSettingsDialog } from "@/components/ui/cookie-settings-dialog";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ModeToggle } from "@/components/ui/mode-toggle";
import type { MarketingHeaderViewProps } from "@/features/marketing/view";
import { Link } from "@/i18n/routing";

import brandImage from "../../assets/brand.svg";

const mainNavTitleKeys: Record<string, string> = {
  Docs: "docs",
  PSEO: "pseo",
  Pricing: "pricing",
  Blog: "blog",
};

const productTitleKeys: Record<string, string> = {
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

const productDescriptionKeys: Record<string, string> = {
  Authentication: "productsMenu.core.authDesc",
  Payments: "productsMenu.core.paymentsDesc",
  Credits: "productsMenu.core.creditsDesc",
  "Background Jobs": "productsMenu.dx.jobsDesc",
  Internationalization: "productsMenu.dx.i18nDesc",
  "AI Integration": "productsMenu.dx.aiDesc",
  "Admin Panel": "productsMenu.infra.adminDesc",
  "File Storage": "productsMenu.infra.storageDesc",
  Monitoring: "productsMenu.infra.monitoringDesc",
};

export function MarketingHeader({
  isPending,
  user,
  mainNav,
  productsNav,
}: MarketingHeaderViewProps) {
  const locale = useLocale();
  const tCookie = useTranslations("Cookie");
  const tCommon = useTranslations("Common");
  const tNavigation = useTranslations("Navigation");
  const copy =
    locale === "zh"
      ? { mainNavigation: "主导航", loadingAccount: "正在加载账户" }
      : {
          mainNavigation: "Main navigation",
          loadingAccount: "Loading account",
        };
  return (
    <header
      className="w-full border-b border-border bg-background"
      data-skin="contrast"
      data-skin-view="marketing.header"
    >
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
        <Link
          className="mr-auto flex items-center gap-2 font-mono text-sm font-bold"
          href="/"
        >
          <Image alt="NextDevTpl" height={24} src={brandImage} width={24} />
          NextDevTpl
        </Link>
        <nav
          aria-label={copy.mainNavigation}
          className="order-3 flex w-full flex-wrap items-center gap-x-3 gap-y-2 md:order-none md:w-auto"
        >
          {mainNav.map((item) => {
            const titleKey = mainNavTitleKeys[item.title];
            return (
              <Link
                className="inline-flex min-h-8 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {titleKey ? tNavigation(titleKey) : item.title}
                {item.external && (
                  <ArrowUpRight aria-hidden="true" className="size-3" />
                )}
              </Link>
            );
          })}
          {productsNav.length > 0 && (
            <details className="relative">
              <summary className="flex min-h-8 cursor-pointer list-none items-center text-sm font-semibold">
                {tCommon("products")}
              </summary>
              <div className="absolute left-0 top-full z-30 mt-2 grid w-[min(30rem,calc(100vw-2rem))] gap-3 border border-border bg-background p-3 shadow-lg sm:grid-cols-2">
                {productsNav.map((group) => (
                  <section
                    className="grid content-start gap-2"
                    key={group.title}
                  >
                    <h2 className="font-mono text-xs font-semibold uppercase text-primary">
                      {productTitleKeys[group.title]
                        ? tNavigation(productTitleKeys[group.title]!)
                        : group.title}
                    </h2>
                    {group.items.map((product) => {
                      const Icon = product.icon;
                      const titleKey = productTitleKeys[product.title];
                      const descriptionKey =
                        productDescriptionKeys[product.title];
                      return (
                        <Link
                          className="flex min-w-0 gap-2 border-t border-border pt-2"
                          href={product.href}
                          key={product.title}
                        >
                          <Icon
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-primary"
                          />
                          <span className="min-w-0">
                            <span className="block break-words text-sm font-semibold">
                              {titleKey ? tNavigation(titleKey) : product.title}
                            </span>
                            <span className="block text-xs leading-5 text-muted-foreground">
                              {descriptionKey
                                ? tNavigation(descriptionKey)
                                : product.description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </section>
                ))}
              </div>
            </details>
          )}
        </nav>
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          {isPending ? (
            <span aria-live="polite" className="text-xs text-muted-foreground">
              {copy.loadingAccount}
            </span>
          ) : user ? (
            <Link
              className="max-w-36 truncate border border-border px-2 py-1 text-xs"
              href="/dashboard"
              title={user.name}
            >
              {user.name}
            </Link>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/sign-in">{tCommon("login")}</Link>
            </Button>
          )}
          <ModeToggle variant="inline" />
          <LanguageSwitcher />
          <CookieSettingsDialog>
            <Button
              aria-label={tCookie("managePreferences")}
              size="icon-sm"
              variant="ghost"
            >
              <span aria-hidden="true" className="font-mono text-xs">
                CC
              </span>
            </Button>
          </CookieSettingsDialog>
        </div>
      </div>
    </header>
  );
}
