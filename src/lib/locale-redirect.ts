import type { Locale } from "@/i18n/routing";

/**
 * 延迟加载国际化导航，避免测试环境加载 Next 导航模块的 Node ESM 入口。
 * 真实请求仍由 next-intl 根据当前 locale 生成重定向响应。
 */
export async function redirectWithLocale(
  href: string,
  locale: Locale
): Promise<never> {
  const { redirect } = await import("@/i18n/routing");
  return redirect({ href, locale });
}
