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
  legal: create.doc("legal", {"en/cookie-policy.mdx": () => import("../src/content/legal/en/cookie-policy.mdx?collection=legal"), "en/privacy.mdx": () => import("../src/content/legal/en/privacy.mdx?collection=legal"), "en/terms.mdx": () => import("../src/content/legal/en/terms.mdx?collection=legal"), }),
};
export default browserCollections;