import { Github, Twitter } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { footerNav, siteConfig } from "@/config";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t bg-background">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          {/* 品牌区 */}
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-xl font-bold"
            >
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative logo */}
              <svg
                className="h-6 w-6 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17 L9 7 L13 14 L21 4" />
                <circle
                  cx="9"
                  cy="7"
                  r="1.4"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="21"
                  cy="4"
                  r="1.4"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              {siteConfig.name}
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>

          {/* 链接区 */}
          <div className="grid grid-cols-2 gap-8">
            {/* 产品 */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">{t("product")}</h3>
              <ul className="space-y-3">
                {footerNav.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 法律 */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">{t("legal")}</h3>
              <ul className="space-y-3">
                {footerNav.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 底部栏 */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            {t("copyright", {
              year: new Date().getFullYear(),
              name: siteConfig.name,
            })}
          </p>

          {/* 社交链接 */}
          <div className="flex items-center gap-4">
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">{t("twitter")}</span>
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">{t("github")}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
