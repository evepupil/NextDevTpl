import { Github, Linkedin, Twitter } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { footerNav, siteConfig } from "@/config";
import { Link } from "@/i18n/routing";

/**
 * Marketing 页面底部
 *
 * 功能:
 * - Newsletter 订阅
 * - 快速链接、资源、法律链接
 * - 社交媒体链接
 * - 版权信息
 */
export async function Footer() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();
  const linkLabels: Record<string, string> = {
    "/features": t("links.features"),
    "/pricing": t("links.pricing"),
    "/docs": t("links.documentation"),
    "/changelog": t("links.changelog"),
    "/blog": t("links.blog"),
    "/guides": t("links.guides"),
    "/support": t("links.support"),
    "/api": t("links.api"),
    "/legal/terms": t("links.terms"),
    "/legal/privacy": t("links.privacy"),
    "/legal/cookie-policy": t("links.cookie"),
  };

  return (
    <footer className="border-t bg-background">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Newsletter */}
          <div className="max-w-md">
            <Link href="/" className="mb-4 inline-block text-xl font-bold">
              {siteConfig.name}
            </Link>
            <p className="mb-6 text-muted-foreground">
              {t("newsletter.description")}
            </p>
            <form className="flex gap-2">
              <Input
                type="email"
                placeholder={t("newsletter.placeholder")}
                className="flex-1"
              />
              <Button className="bg-violet-600 hover:bg-violet-700">
                {t("newsletter.submit")}
              </Button>
            </form>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">
                {t("sections.quickLinks")}
              </h3>
              <ul className="space-y-3">
                {footerNav.quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {linkLabels[link.href] ?? link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">
                {t("sections.resources")}
              </h3>
              <ul className="space-y-3">
                {footerNav.resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {linkLabels[link.href] ?? link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">
                {t("sections.legal")}
              </h3>
              <ul className="space-y-3">
                {footerNav.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {linkLabels[link.href] ?? link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {t("copyright", {
              year,
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
              <span className="sr-only">Twitter</span>
            </Link>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
