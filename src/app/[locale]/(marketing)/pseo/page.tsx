import { getPseoListViewData } from "@/features/pseo/server";
import { skinViews } from "@/modules/skin-views";

export default async function PseoIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const props = getPseoListViewData(locale);
  const View = skinViews["pseo.list"];

  return <View {...props} />;
}
