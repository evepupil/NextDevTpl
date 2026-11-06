export type SkinSourceSelection =
  | { kind: "builtin"; id: string }
  | { kind: "local"; directory: string }
  | { kind: "remote"; url: string; sha256: string; tokenEnv?: string };

export type RemoteSkinSourceSelection = Extract<
  SkinSourceSelection,
  { kind: "remote" }
>;

export type SkinSourceRecord =
  | { kind: "builtin"; id: string }
  | { kind: "local" }
  | { kind: "remote"; archiveSha256: string };

export interface GeneratedSkinRecord {
  id: string;
  version: string;
  packageHash: string;
  source: SkinSourceRecord;
}

export interface ResolvedSkinSource {
  directory: string;
  source: SkinSourceRecord;
  dispose(): Promise<void>;
}
