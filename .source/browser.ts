// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  blog: create.doc("blog", {"en/hello-world.mdx": () => import("../src/content/blog/en/hello-world.mdx?collection=blog"), "zh/hello-world.mdx": () => import("../src/content/blog/zh/hello-world.mdx?collection=blog"), }),
  docs: create.doc("docs", {"index.mdx": () => import("../src/content/docs/index.mdx?collection=docs"), }),
};
export default browserCollections;