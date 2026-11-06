import type { ResolveSkinSourceOptions } from "./skins/source.js";

export interface GeneratorTestHooks {
  afterStageFileDelivered?: (relativePath: string) => Promise<void>;
  runProcess?: (
    command: string,
    args: readonly string[],
    options: { cwd: string; env: NodeJS.ProcessEnv }
  ) => Promise<void>;
  sourceOptions?: Pick<
    ResolveSkinSourceOptions,
    "ca" | "tempDirectory" | "limits"
  >;
}
