import { redirect } from "@/i18n/routing";

export default async function CreditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/dashboard/settings?tab=usage", locale });
}
