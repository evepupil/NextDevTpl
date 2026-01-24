import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/server";

import { BuyCreditPackagesView } from "./buy-credits-view";

/**
 * 购买积分页面元数据
 */
export const metadata = {
  title: "Buy Credits | NextDevKit",
  description: "购买积分套餐以使用 AI 功能",
};

/**
 * 购买积分页面
 */
export default async function BuyCreditsPage() {
  // 获取当前用户会话
  const session = await getServerSession();

  // 如果用户未登录，重定向到登录页
  if (!session || !session.user) {
    redirect("/sign-in");
  }

  return <BuyCreditPackagesView />;
}
