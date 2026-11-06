import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:https";
import type { AddressInfo } from "node:net";
import { gzipSync } from "node:zlib";

import tar from "tar-stream";

export interface ArchiveFixtureEntry {
  name: string;
  body?: string | Buffer;
  type?: "file" | "directory" | "link" | "symlink" | "fifo";
  linkname?: string;
}

export function archiveDigest(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function makeArchive(
  entries: readonly ArchiveFixtureEntry[]
): Promise<Buffer> {
  const pack = tar.pack();
  const chunks: Buffer[] = [];
  const drained = (async () => {
    for await (const chunk of pack) {
      if (!(chunk instanceof Uint8Array)) {
        throw new Error("Expected binary tar fixture data");
      }
      chunks.push(Buffer.from(chunk));
    }
  })();
  for (const entry of entries) {
    const body = Buffer.from(entry.body ?? "");
    await new Promise<void>((resolve, reject) => {
      pack.entry(
        {
          name: entry.name,
          type: entry.type ?? "file",
          ...(entry.linkname ? { linkname: entry.linkname } : {}),
        },
        body,
        (error) => (error ? reject(error) : resolve())
      );
    });
  }
  pack.finalize();
  await drained;
  return gzipSync(Buffer.concat(chunks));
}

export interface LocalHttpsFixture {
  origin: string;
  ca: Buffer;
  connections(): Promise<number>;
  close(): Promise<void>;
}

export async function startLocalHttps(
  handler: (request: IncomingMessage, response: ServerResponse) => void
): Promise<LocalHttpsFixture> {
  const [key, ca] = await Promise.all([
    readFile(new URL("./fixtures/localhost-key.pem", import.meta.url)),
    readFile(new URL("./fixtures/localhost-cert.pem", import.meta.url)),
  ]);
  const server = createServer({ key, cert: ca }, handler);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address() as AddressInfo;
  return {
    origin: `https://127.0.0.1:${address.port}`,
    ca,
    connections: () =>
      new Promise<number>((resolve, reject) => {
        server.getConnections((error, count) =>
          error ? reject(error) : resolve(count)
        );
      }),
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
