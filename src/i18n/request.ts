import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

/**
 * 请求级别的国际化配置
 *
 * 根据请求的语言加载对应的翻译消息
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // 获取请求的语言
  let locale = await requestLocale;

  // 验证语言是否有效，无效则使用默认语言
  if (!locale || !routing.locales.includes(locale as "en" | "zh")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // 动态加载对应语言的翻译文件
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
