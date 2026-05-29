import { createFromSource } from "fumadocs-core/search/server";
import { withApiLogging } from "@/lib/api-logger";
import { docsSource } from "@/lib/source";

/**
 * Orama 搜索 API
 *
 * 基于 fumadocs-core 的 Orama 搜索实现
 * 自动索引文档内容，支持全文搜索
 */
const searchHandlers = createFromSource(docsSource, {
  localeMap: {
    zh: "english",
  },
});

export const GET = withApiLogging(searchHandlers.GET);
