import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";
import { docsSource } from "@/lib/source";

export function generateStaticParams() {
  return docsSource.generateParams().map(({ lang, slug }) => ({
    locale: lang,
    slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const docsLocale = routing.locales.includes(locale as "en" | "zh")
    ? locale
    : routing.defaultLocale;
  const page = docsSource.getPage(slug, docsLocale);

  if (!page) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await params;
  const docsLocale = routing.locales.includes(locale as "en" | "zh")
    ? locale
    : routing.defaultLocale;
  const page = docsSource.getPage(slug, docsLocale);

  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsBody>
        <MDXContent />
      </DocsBody>
    </DocsPage>
  );
}
