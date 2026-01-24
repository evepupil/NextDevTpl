import { defineDocs, defineCollections, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

/**
 * Fumadocs 内容源配置
 *
 * 定义 Blog 和 Docs 两个内容集合
 */

/**
 * 文档集合配置
 */
export const docs = defineDocs({
  dir: "src/content/docs",
});

/**
 * 博客文章 Frontmatter Schema
 */
const blogFrontmatter = frontmatterSchema.extend({
  title: z.string(),
  description: z.string().optional(),
  date: z.string().or(z.date()),
  author: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * 博客集合配置
 */
export const blog = defineCollections({
  dir: "src/content/blog",
  schema: blogFrontmatter,
  type: "doc",
});
