import { skinViews } from "@/modules/skin-views";

/**
 * 重置密码页面
 * 路由: /reset-password
 */
export default function ResetPasswordPage() {
  const ResetPasswordView = skinViews["auth.reset-password"];
  return <ResetPasswordView />;
}
