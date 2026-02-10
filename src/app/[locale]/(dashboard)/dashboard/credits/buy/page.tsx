import { redirect } from "next/navigation";

/**
 * 购买积分页面 - 暂时禁用
 *
 * 积分包购买功能暂时隐藏，重定向到设置页面
 * TODO: 未来启用时恢复此页面
 */
export default async function BuyCreditsPage() {
  // 暂时禁用积分包购买，重定向到设置页面
  redirect("/dashboard/settings?tab=usage");
}
