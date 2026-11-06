import { skinViews } from "@/modules/skin-views";

/**
 * 注册页面
 * 路由: /sign-up
 */
export default function SignUpPage() {
  const SignUpView = skinViews["auth.sign-up"];
  return <SignUpView />;
}
