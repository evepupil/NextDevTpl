import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import type { ClientRequest, IncomingMessage } from "node:http";
import { request as httpsRequest, type RequestOptions } from "node:https";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { failSkin, SkinValidationError } from "./errors.js";
import type { SkinSourceLimits } from "./limits.js";
import { getRemoteSkinToken, SkinSourceError } from "./source-env.js";
import type { RemoteSkinSourceSelection } from "./source-types.js";

interface SkinRequestResponse {
  request: ClientRequest;
  response: IncomingMessage;
}

interface DownloadOptions {
  env?: NodeJS.ProcessEnv;
  ca?: RequestOptions["ca"];
  limits: SkinSourceLimits;
}

function hasUrlControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code <= 32 || code === 127;
  });
}

function parseRemoteUrl(value: string): URL {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.trim() !== value ||
    hasUrlControlCharacter(value) ||
    value.includes("?") ||
    value.includes("#")
  ) {
    failSkin(["Remote skin URL is invalid"]);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    failSkin(["Remote skin URL is invalid"]);
  }

  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    failSkin(["Remote skin URL must be HTTPS without credentials or query"]);
  }

  return url;
}

function requestResponse(
  url: URL,
  options: RequestOptions
): Promise<SkinRequestResponse> {
  return new Promise((resolve, reject) => {
    let response: IncomingMessage | undefined;
    const request = httpsRequest(url, options, (incoming) => {
      response = incoming;
      resolve({ request, response: incoming });
    });

    request.once("error", (error: Error) => {
      if (response && !response.destroyed) {
        response.destroy();
      } else {
        void waitForClose(request).then(() => reject(error));
      }
    });
    request.end();
  });
}

function waitForClose(stream: ClientRequest | IncomingMessage): Promise<void> {
  if (stream.closed) return Promise.resolve();
  return new Promise((resolve) => stream.once("close", resolve));
}

async function destroyResponseAndRequest({
  request,
  response,
}: SkinRequestResponse): Promise<void> {
  const responseClosed = waitForClose(response);
  const requestClosed = waitForClose(request);
  response.destroy();
  request.destroy();
  await Promise.all([responseClosed, requestClosed]);
}

async function awaitResponseAndRequestClose({
  request,
  response,
}: SkinRequestResponse): Promise<void> {
  await Promise.all([waitForClose(response), waitForClose(request)]);
}

function validateContentLength(
  response: IncomingMessage,
  maximum: number
): void {
  const values: string[] = [];
  for (let index = 0; index < response.rawHeaders.length; index += 2) {
    if (response.rawHeaders[index]?.toLowerCase() === "content-length") {
      values.push(response.rawHeaders[index + 1] ?? "");
    }
  }

  if (values.length > 1) {
    failSkin(["Remote skin response has duplicate content length"]);
  }
  if (values.length === 0) return;

  const value = values[0] ?? "";
  if (!/^\d+$/u.test(value)) {
    failSkin(["Remote skin response has invalid content length"]);
  }

  const size = Number(value);
  if (!Number.isSafeInteger(size) || size > maximum) {
    failSkin(["Remote skin download exceeds its size limit"]);
  }
}

function countAndHash(maximum: number): {
  stream: Transform;
  digest(): string;
} {
  let bytes = 0;
  const hash = createHash("sha256");
  const stream = new Transform({
    transform(chunk: Buffer | string, encoding, callback) {
      const data = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk, encoding);
      bytes += data.byteLength;
      if (bytes > maximum) {
        callback(
          new SkinValidationError([
            "Remote skin download exceeds its size limit",
          ])
        );
        return;
      }
      hash.update(data);
      callback(null, data);
    },
  });

  return { stream, digest: () => hash.digest("hex") };
}

function redirectUrl(current: URL, response: IncomingMessage): URL {
  const location = response.headers.location;
  if (!location) failSkin(["Remote skin redirect has no location"]);

  let next: URL;
  try {
    next = new URL(location, current);
  } catch {
    failSkin(["Remote skin redirect is invalid"]);
  }

  if (
    next.protocol !== "https:" ||
    next.origin !== current.origin ||
    next.username !== "" ||
    next.password !== "" ||
    next.search !== "" ||
    next.hash !== "" ||
    location.includes("?") ||
    location.includes("#")
  ) {
    failSkin(["Remote skin redirect must remain on the original HTTPS origin"]);
  }
  return next;
}

export async function downloadRemoteSkinArchive(
  selection: RemoteSkinSourceSelection,
  archivePath: string,
  options: DownloadOptions
): Promise<string> {
  const initialUrl = parseRemoteUrl(selection.url);
  if (!/^[a-f0-9]{64}$/iu.test(selection.sha256)) {
    failSkin(["Remote skin SHA-256 must contain 64 hexadecimal characters"]);
  }

  const token = getRemoteSkinToken(selection, options.env);
  const headers: Record<string, string> = {
    accept: "application/gzip, application/x-gzip, application/octet-stream",
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.limits.timeoutMs);

  try {
    let currentUrl = initialUrl;
    let redirects = 0;

    while (true) {
      const requestOptions: RequestOptions = {
        method: "GET",
        agent: false,
        headers,
        signal: controller.signal,
        ...(options.ca === undefined ? {} : { ca: options.ca }),
      };
      const { request, response } = await requestResponse(
        currentUrl,
        requestOptions
      );
      let responseConsumed = false;

      try {
        if (
          response.statusCode !== undefined &&
          response.statusCode >= 300 &&
          response.statusCode < 400
        ) {
          if (redirects >= 3) {
            failSkin(["Remote skin redirect limit exceeded"]);
          }
          const nextUrl = redirectUrl(currentUrl, response);
          redirects += 1;
          currentUrl = nextUrl;
          continue;
        }

        if (response.statusCode !== 200) {
          failSkin(["Remote skin server returned an unsuccessful status"]);
        }

        validateContentLength(response, options.limits.maxDownloadBytes);

        const counter = countAndHash(options.limits.maxDownloadBytes);
        const output = createWriteStream(archivePath, {
          flags: "wx",
          mode: 0o600,
        });
        await pipeline(response, counter.stream, output, {
          signal: controller.signal,
        });
        responseConsumed = true;

        await awaitResponseAndRequestClose({ request, response });
        if (timedOut) {
          throw new SkinSourceError("Remote skin download timed out");
        }

        const actualHash = counter.digest();
        if (actualHash !== selection.sha256.toLowerCase()) {
          failSkin(["Remote skin archive SHA-256 does not match"]);
        }
        return actualHash;
      } finally {
        if (responseConsumed) {
          await awaitResponseAndRequestClose({ request, response });
        } else {
          await destroyResponseAndRequest({ request, response });
        }
      }
    }
  } catch (error) {
    if (timedOut) {
      throw new SkinSourceError("Remote skin download timed out");
    }
    if (
      error instanceof SkinValidationError ||
      error instanceof SkinSourceError
    ) {
      throw error;
    }
    throw new SkinSourceError("Remote skin download failed");
  } finally {
    clearTimeout(timeout);
  }
}
