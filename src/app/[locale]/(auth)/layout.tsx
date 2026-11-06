import { skinViews } from "@/modules/skin-views";

/**
 * Auth 路由组布局
 *
 * 品牌分屏：左 = 深色品牌面板（lg+ 显示），右 = 跟随主题的表单区 + 页脚。
 * 移动端品牌面板隐藏，只剩表单 + 页脚。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const AuthLayoutView = skinViews["auth.layout"];
  return <AuthLayoutView>{children}</AuthLayoutView>;
}
