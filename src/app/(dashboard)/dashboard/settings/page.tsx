import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/server";
import { SettingsProfileView } from "@/features/settings/components";

/**
 * 设置页面元数据
 */
export const metadata = {
  title: "Settings | NextDevKit",
  description: "管理您的账户设置和偏好",
};

/**
 * 用户设置页面
 *
 * Server Component - 在服务端获取用户数据
 * 将数据传递给客户端 SettingsProfileView 组件
 */
export default async function SettingsPage() {
  // 获取当前用户会话
  const session = await getServerSession();

  // 如果用户未登录，重定向到登录页
  if (!session || !session.user) {
    redirect("/sign-in");
  }

  return (
    <SettingsProfileView
      user={{
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image,
      }}
    />
  );
}
