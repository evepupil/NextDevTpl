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
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RootProvider>{children}</RootProvider>
    </ThemeProvider>
  );
}
