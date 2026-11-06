import { skinViews } from "@/modules/skin-views";

/**
 * 登录页面
 * 路由: /sign-in
 */
export default function SignInPage() {
  const SignInView = skinViews["auth.sign-in"];
  return <SignInView />;
}
