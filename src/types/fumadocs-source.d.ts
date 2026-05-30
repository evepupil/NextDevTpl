declare module "../../.source/server" {
  import type { InferCollectionsType } from "fumadocs-mdx/config";
  import type { blog as blogConfig, docs as docsConfig, legal as legalConfig } from "../../source.config";

  const docs: ReturnType<typeof docsConfig.toFumadocsSource>;
  const blog: InferCollectionsType<typeof blogConfig>;
  const legal: InferCollectionsType<typeof legalConfig>;

  export { blog, docs, legal };
}
