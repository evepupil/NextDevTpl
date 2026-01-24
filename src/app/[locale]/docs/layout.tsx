import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

import { Header } from "@/components/shared/header";
import { docsSource } from "@/lib/source";

/**
 * 文档布局
 *
 * 使用 Fumadocs UI 的 DocsLayout 组件
 * 提供侧边栏导航和文档结构
 * 同时保留网站顶部导航栏
 */
export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  // 获取页面树（不需要 locale，因为 i18n 由 Next.js 路由处理）
  const tree = docsSource.pageTree;

  return (
    <>
      {/* 网站顶部导航栏 - 放在 DocsLayout 外部确保显示 */}
      <Header />

      {/* Fumadocs 文档布局 */}
      <DocsLayout
        tree={tree}
        nav={{
          enabled: false, // 禁用 Fumadocs 自带的顶部导航
        }}
        sidebar={{
          defaultOpenLevel: 1,
        }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
