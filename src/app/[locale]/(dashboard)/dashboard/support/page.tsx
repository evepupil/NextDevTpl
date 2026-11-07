import { SupportListPage as SupportListPageView } from "@/modules/view-pages";

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
  return <SupportListPageView locale={locale} />;
}
