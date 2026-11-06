import { skinViews } from "@/modules/skin-views";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const props = { children };
  const View = skinViews["marketing.layout"];

  return <View {...props} />;
}
