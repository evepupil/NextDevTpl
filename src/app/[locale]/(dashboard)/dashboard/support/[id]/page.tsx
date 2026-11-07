import { SupportDetailPage as SupportDetailPageView } from "@/modules/view-pages";

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

  return <SupportDetailPageView ticketId={id} locale={locale} />;
}
