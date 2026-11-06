import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAllPseoParams,
  getPseoDetailViewData,
  getPseoPage,
} from "@/features/pseo/server";
import { skinViews } from "@/modules/skin-views";

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
  const props = getPseoDetailViewData(locale, slug);
  if (!props) {
    notFound();
  }

  const View = skinViews["pseo.detail"];

  return <View {...props} />;
}
