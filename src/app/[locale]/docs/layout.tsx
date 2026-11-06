import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

import { routing } from "@/i18n/routing";
import { docsI18n, docsSource } from "@/lib/source";
import { Header } from "@/skin/views/marketing/components/header";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const docsLocale = routing.locales.includes(locale as "en" | "zh")
    ? locale
    : routing.defaultLocale;
  const tree = docsSource.getPageTree(docsLocale);

  return (
    <>
      <Header />

      <DocsLayout
        tree={tree}
        i18n={docsI18n}
        nav={{
          enabled: false,
        }}
        sidebar={{
          defaultOpenLevel: 1,
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
