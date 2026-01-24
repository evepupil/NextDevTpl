// source.config.ts
import { defineDocs, defineCollections, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";
var docs = defineDocs({
  dir: "src/content/docs"
});
var blogFrontmatter = frontmatterSchema.extend({
  title: z.string(),
  description: z.string().optional(),
  date: z.string().or(z.date()),
  author: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional()
});
var blog = defineCollections({
  dir: "src/content/blog",
  schema: blogFrontmatter,
  type: "doc"
});
export {
  blog,
  docs
};
