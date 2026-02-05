import { getLocale, getTranslations } from "next-intl/server";

import { getServerSession } from "@/lib/auth/server";
import { SettingsProfileView } from "@/features/settings/components";
import { redirect } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Settings" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

/**
 * 用户设置页面
 *
 * Server Component - 在服务端获取用户数据
 * 将数据传递给客户端 SettingsProfileView 组件
 */
export default async function SettingsPage() {
  // 获取当前用户会话
  const session = await getServerSession();
  const locale = await getLocale();

  // 如果用户未登录，重定向到登录页
  const user = session?.user;
  if (!user) {
    redirect({ href: "/sign-in", locale });
  }
  const safeUser = user!;

  return (
    <SettingsProfileView
      user={{
        id: safeUser.id,
        name: safeUser.name || "",
        email: safeUser.email || "",
        image: safeUser.image,
      }}
    />
  );
}
