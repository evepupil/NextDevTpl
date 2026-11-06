import { skinViews } from "@/modules/skin-views";

/**
 * 忘记密码页面
 * 路由: /forgot-password
 */
export default function ForgotPasswordPage() {
  const ForgotPasswordView = skinViews["auth.forgot-password"];
  return <ForgotPasswordView />;
}
