import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PseoCta,
  PseoFaq,
  PseoFeatureGrid,
  PseoHero,
  PseoRelated,
  PseoUseCases,
} from "@/features/pseo/components";
import {
  getAllPseoParams,
  getPseoPage,
  getRelatedPseoPages,
} from "@/features/pseo/lib/pseo-data";

export function generateStaticParams() {
  return getAllPseoParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getPseoPage(locale, slug);

  if (!page) {
    return { title: "PSEO Template Not Found" };
  }

  return {
    title: page.data.seo.title,
    description: page.data.seo.description,
  };
}

export default async function PseoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const page = getPseoPage(locale, slug);

  if (!page) {
    notFound();
  }

  const related = getRelatedPseoPages(page.locale, page.slug);

  return (
    <>
      <PseoHero page={page} />
      <PseoFeatureGrid page={page} />
      <PseoUseCases page={page} />
      <PseoFaq page={page} />
      <PseoRelated
        pages={related}
        title={page.data.sections.related.title}
        subtitle={page.data.sections.related.subtitle}
      />
      <PseoCta page={page} />
    </>
  );
}
