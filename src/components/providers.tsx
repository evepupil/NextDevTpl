"use client";

import { ThemeProvider } from "next-themes";

/**
 * 全局 Providers 组件
 *
 * 功能:
 * - 主题管理 (next-themes)
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
      {children}
    </ThemeProvider>
  );
}
