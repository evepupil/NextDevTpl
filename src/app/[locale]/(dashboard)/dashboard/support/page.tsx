import { getSupportListViewData } from "@/features/support/server";
import { redirect } from "@/i18n/routing";
import { getServerSession } from "@/lib/auth/server";
import { skinViews } from "@/modules/skin-views";

/**
 * 用户工单列表页面
 *
 * 展示用户提交的所有支持工单
 */
export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // 获取当前用户会话
  const session = await getServerSession();
  if (!session?.user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }

  const data = await getSupportListViewData(session.user.id, locale);
  const View = skinViews["support.list"];

  return <View {...data} />;
}
