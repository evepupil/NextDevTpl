import { createFromSource } from "fumadocs-core/search/server";

import { docsSource } from "@/lib/source";

/**
 * Orama 搜索 API
 *
 * 基于 fumadocs-core 的 Orama 搜索实现
 * 自动索引文档内容，支持全文搜索
 */
export const { GET } = createFromSource(docsSource);
