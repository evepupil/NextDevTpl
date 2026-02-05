import { getLocale, getTranslations } from "next-intl/server";

import { getServerSession } from "@/lib/auth/server";
import { redirect } from "@/i18n/routing";

import { BuyCreditPackagesView } from "./buy-credits-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Credits.buy" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/**
 * 购买积分页面
 */
export default async function BuyCreditsPage() {
  // 获取当前用户会话
  const session = await getServerSession();
  const locale = await getLocale();

  // 如果用户未登录，重定向到登录页
  if (!session || !session.user) {
    redirect({ href: "/sign-in", locale });
  }

  return <BuyCreditPackagesView />;
}
