// @ts-nocheck
import * as __fd_glob_2 from "../src/content/blog/en/hello-world.mdx?collection=blog"
import * as __fd_glob_1 from "../src/content/blog/zh/hello-world.mdx?collection=blog"
import * as __fd_glob_0 from "../src/content/docs/index.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const blog = await create.doc("blog", "src/content/blog", {"zh/hello-world.mdx": __fd_glob_1, "en/hello-world.mdx": __fd_glob_2, });

export const docs = await create.docs("docs", "src/content/docs", {}, {"index.mdx": __fd_glob_0, });