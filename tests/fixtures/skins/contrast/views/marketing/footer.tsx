"use client";

import { useLocale, useTranslations } from "next-intl";

import { useMarketingFooterController } from "@/features/marketing/view";
import { Link } from "@/i18n/routing";

export function MarketingFooter() {
  const locale = useLocale();
  const footer = useMarketingFooterController();
  const t = useTranslations("Auth.footer");
  const tCommon = useTranslations("Common");
  const copy =
    locale === "zh"
      ? {
          productLinks: "产品链接",
          legalLinks: "法律链接",
          socialLinks: "社交链接",
        }
      : {
          productLinks: "Product links",
          legalLinks: "Legal links",
          socialLinks: "Social links",
        };
  const year = new Date().getFullYear();
  const titleForLink = (item: { title: string; href: string }) => {
    if (item.href === "/#pricing") return tCommon("pricing");
    if (item.href === "/blog") return tCommon("changelog");
    if (item.href === "/legal/terms") return t("terms");
    if (item.href === "/legal/privacy") return t("privacy");
    if (item.href === "/legal/cookie-policy") return t("cookies");
    if (item.href.startsWith("mailto:")) {
      return locale === "zh" ? "联系我们" : "Contact Us";
    }
    return item.title;
  };

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-4 py-8">
        <div className="grid gap-2">
          <Link className="font-mono text-sm font-bold" href="/">
            {footer.siteName}
          </Link>
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            {t("copyright", { year, name: footer.siteName })}
          </p>
        </div>
        <nav aria-label={copy.productLinks} className="grid gap-2 text-sm">
          {footer.productLinks.map((item) =>
            item.external ? (
              <a
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                href={item.href}
                key={item.title}
                rel="noreferrer"
                target="_blank"
              >
                {titleForLink(item)}
              </a>
            ) : (
              <Link
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                href={item.href}
                key={item.title}
              >
                {titleForLink(item)}
              </Link>
            )
          )}
        </nav>
        <nav aria-label={copy.legalLinks} className="grid gap-2 text-sm">
          {footer.legalLinks.map((item) => (
            <Link
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href={item.href}
              key={item.href}
            >
              {titleForLink(item)}
            </Link>
          ))}
        </nav>
        <nav
          aria-label={copy.socialLinks}
          className="flex flex-wrap gap-3 text-sm"
        >
          <a href={footer.socialLinks.github} rel="noreferrer" target="_blank">
            GitHub
          </a>
          <a href={footer.socialLinks.twitter} rel="noreferrer" target="_blank">
            Twitter
          </a>
        </nav>
      </div>
    </footer>
  );
}
