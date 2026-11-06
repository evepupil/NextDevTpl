import { cp, mkdir, readdir, readFile, rmdir } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveSkinSource } from "../../../packages/create-nextdevtpl/src/skins/source";
import type { SkinSourceSelection } from "../../../packages/create-nextdevtpl/src/skins/source-types";
import {
  type ArchiveFixtureEntry,
  archiveDigest,
  type LocalHttpsFixture,
  makeArchive,
  startLocalHttps,
} from "./https-fixture";
import { createSkinFixture, type SkinFixture } from "./skin-fixture";

describe("skin source acquisition", () => {
  let fixture: SkinFixture;
  let downloadDirectory: string;
  let content: Buffer;
  let handler: (request: IncomingMessage, response: ServerResponse) => void;
  let server: LocalHttpsFixture;
  const otherServers: LocalHttpsFixture[] = [];

  async function fixtureEntries(): Promise<ArchiveFixtureEntry[]> {
    const paths = ["skin.json", ...Object.keys(fixture.manifest.files)];
    return Promise.all(
      paths.map(async (name) => ({
        name,
        body: await readFile(join(fixture.directory, name)),
      }))
    );
  }

  function selection(path = "/skin.tgz"): SkinSourceSelection {
    return {
      kind: "remote",
      url: `${server.origin}${path}`,
      sha256: archiveDigest(content),
    };
  }

  function options() {
    return {
      templateRoot: fixture.templateDirectory,
      tempDirectory: downloadDirectory,
      ca: server.ca,
    };
  }

  beforeEach(async () => {
    fixture = await createSkinFixture();
    downloadDirectory = join(fixture.root, "downloads");
    await mkdir(downloadDirectory);
    content = await makeArchive(await fixtureEntries());
    handler = (_request, response) => {
      response.writeHead(200, { "content-type": "application/gzip" });
      response.end(content);
    };
    server = await startLocalHttps((request, response) => {
      handler(request, response);
    });
  });

  afterEach(async () => {
    await server?.close();
    for (const additional of otherServers.splice(0)) await additional.close();
    await fixture?.dispose();
  });

  it("resolves a local directory without deleting its contents", async () => {
    const local = await resolveSkinSource(
      { kind: "local", directory: fixture.directory },
      options()
    );
    expect(local.directory).toBe(fixture.directory);
    expect(local.source).toEqual({ kind: "local" });
    await local.dispose();
    expect(
      await readFile(join(fixture.directory, "skin.json"), "utf8")
    ).toContain("test-skin");
  });

  it("finds the default skin from the supplied template root", async () => {
    const directory = join(fixture.templateDirectory, "src", "skin");
    await cp(fixture.directory, directory, { recursive: true });
    const resolved = await resolveSkinSource(undefined, options());
    expect(resolved.directory).toBe(directory);
    expect(resolved.source).toEqual({ kind: "builtin", id: "default" });
    await resolved.dispose();
    expect(await readFile(join(directory, "skin.json"), "utf8")).toContain(
      "test-skin"
    );
  });

  it("rejects unknown built-in identifiers", async () => {
    await expect(
      resolveSkinSource({ kind: "builtin", id: "unavailable" }, options())
    ).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("downloads over verified local HTTPS and releases its private directory", async () => {
    const resolved = await resolveSkinSource(selection(), options());
    expect(resolved.source).toEqual({
      kind: "remote",
      archiveSha256: archiveDigest(content),
    });
    expect(await readFile(join(resolved.directory, "skin.json"), "utf8")).toBe(
      await readFile(join(fixture.directory, "skin.json"), "utf8")
    );
    expect(await readdir(downloadDirectory)).not.toEqual([]);
    await resolved.dispose();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("supports an anonymous same-origin redirect", async () => {
    const visited: string[] = [];
    handler = (request, response) => {
      visited.push(request.url ?? "");
      if (request.url === "/redirect") {
        response.writeHead(302, { location: "/skin.tgz" });
        response.end();
      } else {
        response.end(content);
      }
    };
    const resolved = await resolveSkinSource(selection("/redirect"), options());
    expect(visited).toEqual(["/redirect", "/skin.tgz"]);
    await resolved.dispose();
  });

  it("sends a configured token only in the authorization header", async () => {
    const seen: Array<{ path: string; authorization: string | undefined }> = [];
    handler = (request, response) => {
      seen.push({
        path: request.url ?? "",
        authorization: request.headers.authorization,
      });
      response.end(content);
    };
    const source = selection();
    if (source.kind !== "remote") throw new Error("Expected remote fixture");
    const resolved = await resolveSkinSource(
      { ...source, tokenEnv: "TEST_SKIN_TOKEN" },
      {
        ...options(),
        env: { NODE_ENV: "test", TEST_SKIN_TOKEN: "fixture-token" },
      }
    );
    expect(seen).toEqual([
      { path: "/skin.tgz", authorization: "Bearer fixture-token" },
    ]);
    expect(JSON.stringify(resolved.source)).not.toContain("fixture-token");
    expect(JSON.stringify(resolved.source)).not.toContain(server.origin);
    await resolved.dispose();
  });

  it("rejects a missing explicitly named token before making a request", async () => {
    let requests = 0;
    handler = (_request, response) => {
      requests += 1;
      response.end(content);
    };
    const source = selection();
    if (source.kind !== "remote") throw new Error("Expected remote fixture");
    await expect(
      resolveSkinSource(
        { ...source, tokenEnv: "MISSING_TEST_TOKEN" },
        { ...options(), env: { NODE_ENV: "test" } }
      )
    ).rejects.toThrow();
    expect(requests).toBe(0);
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("rejects cross-origin redirects without forwarding credentials", async () => {
    let redirectedRequests = 0;
    const other = await startLocalHttps((_request, response) => {
      redirectedRequests += 1;
      response.end(content);
    });
    otherServers.push(other);
    handler = (_request, response) => {
      response.writeHead(302, { location: `${other.origin}/skin.tgz` });
      response.write("unending-redirect-body");
    };
    await expect(
      resolveSkinSource(selection(), {
        ...options(),
        env: { NODE_ENV: "test", NEXTDEVTPL_SKIN_TOKEN: "fixture-token" },
      })
    ).rejects.toThrow();
    expect(redirectedRequests).toBe(0);
    await expect.poll(() => server.connections(), { timeout: 2000 }).toBe(0);
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("bounds same-origin redirect loops", async () => {
    let requests = 0;
    handler = (_request, response) => {
      requests += 1;
      response.writeHead(302, { location: "/again" });
      response.end();
    };
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(requests).toBeLessThanOrEqual(4);
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it.each([
    "http://127.0.0.1/skin.tgz",
    "https://user:password@example.test/skin.tgz",
    "https://example.test/skin.tgz?token=hidden",
    "https://example.test/skin.tgz#hidden",
  ])("rejects unsafe source addresses before acquisition: %s", async (url) => {
    await expect(
      resolveSkinSource(
        { kind: "remote", url, sha256: archiveDigest(content) },
        options()
      )
    ).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("rejects the wrong trusted digest and cleans downloaded bytes", async () => {
    const source = selection();
    if (source.kind !== "remote") throw new Error("Expected remote fixture");
    await expect(
      resolveSkinSource({ ...source, sha256: "0".repeat(64) }, options())
    ).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("does not reveal the remote URL, token or response body on HTTP failure", async () => {
    handler = (_request, response) => {
      response.writeHead(403);
      response.end("private-response-marker");
    };
    const error = await resolveSkinSource(selection("/private-path-marker"), {
      ...options(),
      env: { NODE_ENV: "test", NEXTDEVTPL_SKIN_TOKEN: "private-token-marker" },
    }).catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(Error);
    const displayed = String(error);
    expect(displayed).not.toContain(server.origin);
    expect(displayed).not.toContain("private-path-marker");
    expect(displayed).not.toContain("private-token-marker");
    expect(displayed).not.toContain("private-response-marker");
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("counts actual download bytes without a content length", async () => {
    await expect(
      resolveSkinSource(selection(), {
        ...options(),
        limits: { maxDownloadBytes: content.length - 1 },
      })
    ).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("accepts archives exactly at their configured byte and entry limits", async () => {
    const entries = await fixtureEntries();
    const largestFile = Math.max(
      ...entries.map((entry) => Buffer.byteLength(entry.body ?? ""))
    );
    const resolved = await resolveSkinSource(selection(), {
      ...options(),
      limits: {
        maxDownloadBytes: content.length,
        maxExtractedBytes: gunzipSync(content).length,
        maxFileBytes: largestFile,
        maxEntries: entries.length,
      },
    });
    await resolved.dispose();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("rejects an oversized declared content length", async () => {
    handler = (_request, response) => {
      response.writeHead(200, { "content-length": content.length + 1024 });
      response.end(content);
    };
    await expect(
      resolveSkinSource(selection(), {
        ...options(),
        limits: { maxDownloadBytes: content.length },
      })
    ).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("interrupts a stalled response and removes partial files", async () => {
    handler = (_request, response) => {
      response.writeHead(200);
      response.write(content.subarray(0, 16));
    };
    await expect(
      resolveSkinSource(selection(), {
        ...options(),
        limits: { timeoutMs: 100 },
      })
    ).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it.each([
    { maxExtractedBytes: 512 },
    { maxFileBytes: 8 },
    { maxEntries: 1 },
  ])("bounds extracted archives: %j", async (limits) => {
    await expect(
      resolveSkinSource(selection(), { ...options(), limits })
    ).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it.each([
    "../outside.ts",
    "/absolute.ts",
    "C:/outside.ts",
    "views\\outside.ts",
    "assets/CON.svg",
    "assets/portrait.svg.",
    "assets/portrait.svg ",
  ])("rejects an unsafe archive path: %s", async (name) => {
    content = await makeArchive([
      ...(await fixtureEntries()),
      { name, body: "untrusted" },
    ]);
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it.each([
    "link",
    "symlink",
    "fifo",
  ] as const)("rejects non-regular archive entries: %s", async (type) => {
    content = await makeArchive([
      ...(await fixtureEntries()),
      { name: "assets/untrusted.svg", type, linkname: "../../outside" },
    ]);
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it.each([
    "tokens.css",
    "TOKENS.css",
    "./tokens.css",
  ])("rejects duplicate or case-colliding effective paths: %s", async (name) => {
    content = await makeArchive([
      ...(await fixtureEntries()),
      { name, body: "replacement" },
    ]);
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("accepts the conventional ./ archive prefix", async () => {
    content = await makeArchive([
      { name: "./", type: "directory" },
      ...(await fixtureEntries()).map((entry) => ({
        ...entry,
        name: `./${entry.name}`,
      })),
    ]);
    const resolved = await resolveSkinSource(selection(), options());
    expect(await readFile(join(resolved.directory, "tokens.css"), "utf8")).toBe(
      await readFile(join(fixture.directory, "tokens.css"), "utf8")
    );
    await resolved.dispose();
  });

  it("does not strip a common outer archive folder", async () => {
    content = await makeArchive(
      (await fixtureEntries()).map((entry) => ({
        ...entry,
        name: `skin/${entry.name}`,
      }))
    );
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("rejects truncated gzip data after checking its exact digest", async () => {
    content = content.subarray(0, content.length - 5);
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("rejects a truncated tar member inside valid gzip data", async () => {
    content = gzipSync(gunzipSync(content).subarray(0, 600));
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("checks duplicate paths in concatenated tar members", async () => {
    const second = await makeArchive([{ name: "tokens.css", body: "extra" }]);
    content = gzipSync(
      Buffer.concat([gunzipSync(content), gunzipSync(second)])
    );
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("rejects oversized long-path metadata without retaining partial files", async () => {
    content = await makeArchive([
      { name: `assets/${"a".repeat(4 * 1024 * 1024 + 1)}.svg`, body: "x" },
    ]);
    await expect(resolveSkinSource(selection(), options())).rejects.toThrow();
    expect(await readdir(downloadDirectory)).toEqual([]);
  });

  it("never cleans the parent of its private acquisition directory", async () => {
    const sentinel = join(fixture.root, "sibling");
    await mkdir(sentinel);
    const resolved = await resolveSkinSource(selection(), options());
    await resolved.dispose();
    expect(await readdir(sentinel)).toEqual([]);
    await rmdir(sentinel);
  });
});
