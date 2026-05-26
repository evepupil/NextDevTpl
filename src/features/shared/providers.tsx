"use client";

import { RootProvider } from "fumadocs-ui/provider/next";
import { ThemeProvider } from "next-themes";

/**
 * 全局 Providers 组件
 *
 * 功能:
 * - 主题管理 (next-themes)
 * - Fumadocs UI 框架支持 (RootProvider)
 * - 可扩展添加其他 Provider (如 QueryClient, SessionProvider 等)
 */

interface ProvidersProps {
  children: React.ReactNode;
  locale?: string;
}

const docsLocales = [
  { locale: "en", name: "English" },
  { locale: "zh", name: "中文" },
];

const zhDocsTranslations = {
  search: "搜索",
  searchNoResult: "没有找到结果",
  toc: "本页目录",
  tocNoHeadings: "没有标题",
  lastUpdate: "最后更新于",
  chooseLanguage: "选择语言",
  nextPage: "下一页",
  previousPage: "上一页",
  chooseTheme: "选择主题",
  editOnGithub: "在 GitHub 编辑",
} as const;

export function Providers({ children, locale = "en" }: ProvidersProps) {
  const docsLocale = locale === "zh" ? "zh" : "en";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RootProvider
        i18n={{
          locale: docsLocale,
          locales: docsLocales,
          ...(docsLocale === "zh" ? { translations: zhDocsTranslations } : {}),
        }}
      >
        {children}
      </RootProvider>
    </ThemeProvider>
  );
}
