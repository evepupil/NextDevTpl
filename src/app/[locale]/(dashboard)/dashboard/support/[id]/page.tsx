import { notFound } from "next/navigation";
import { getSupportDetailViewData } from "@/features/support/server";
import { redirect } from "@/i18n/routing";
import { getServerSession } from "@/lib/auth/server";
import { skinViews } from "@/modules/skin-views";

interface TicketDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

/**
 * 工单详情页面
 *
 * 展示工单信息和消息历史，允许用户回复
 */
export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { id, locale } = await params;

  // 获取当前用户会话
  const session = await getServerSession();
  if (!session?.user) {
    redirect({ href: "/sign-in", locale });
    return null;
  }

  const data = await getSupportDetailViewData({
    locale,
    ticketId: id,
    userId: session.user.id,
  });
  if (!data) notFound();

  const View = skinViews["support.detail"];
  return <View {...data} />;
}
