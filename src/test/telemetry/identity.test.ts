import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createTelemetryAttribution,
  getClientTelemetryHeaders,
  getTelemetryContextFromRequest,
  normalizeTelemetryIdentifier,
  parseTelemetryAttribution,
  serializeTelemetryAttribution,
  TELEMETRY_ANONYMOUS_ID_HEADER,
  TELEMETRY_ATTRIBUTION_HEADER,
} from "@/lib/telemetry/identity";

describe("telemetry identity and attribution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the first source while updating the latest campaign", () => {
    const initial = createTelemetryAttribution({
      referrer: "https://newsletter.example.test/welcome",
      url: "https://app.example.test/en?utm_source=newsletter&utm_campaign=launch",
    });
    const latest = createTelemetryAttribution({
      previous: initial,
      url: "https://app.example.test/en?utm_source=search&utm_medium=cpc",
    });

    expect(initial).toEqual({
      initialSource: "newsletter",
      latestSource: "newsletter",
      utm: { campaign: "launch", source: "newsletter" },
    });
    expect(latest).toEqual({
      initialSource: "newsletter",
      latestSource: "search",
      utm: { medium: "cpc", source: "search" },
    });
  });

  it("reads bounded identity and attribution values from request headers", () => {
    const attribution = serializeTelemetryAttribution({
      initialSource: "newsletter",
      latestSource: "search",
      utm: { source: "search", medium: "cpc" },
    });
    const headers = new Headers({
      [TELEMETRY_ANONYMOUS_ID_HEADER]: "anon_visitor-1",
      [TELEMETRY_ATTRIBUTION_HEADER]: attribution ?? "",
      "accept-language": "zh-CN,zh;q=0.9",
    });

    expect(
      getTelemetryContextFromRequest({ headers }, { userId: "user-1" })
    ).toEqual({
      identity: { anonymousId: "anon_visitor-1", userId: "user-1" },
      initialSource: "newsletter",
      latestSource: "search",
      locale: "zh-CN",
      utm: { medium: "cpc", source: "search" },
    });
  });

  it("rejects malformed anonymous identifiers", () => {
    expect(normalizeTelemetryIdentifier("anon visitor")).toBeUndefined();
    expect(normalizeTelemetryIdentifier("Bearer-secret")).toBe("Bearer-secret");
    expect(parseTelemetryAttribution("not-json")).toBeUndefined();
  });

  it("does not block auth requests when browser storage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem() {
          throw new Error("storage disabled");
        },
        setItem() {
          throw new Error("storage disabled");
        },
      },
      location: { href: "https://app.example.test/en" },
    });
    vi.stubGlobal("document", {
      documentElement: { lang: "en" },
      get referrer() {
        return "";
      },
      get cookie() {
        throw new Error("cookies disabled");
      },
      set cookie(_value: string) {
        throw new Error("cookies disabled");
      },
    });

    expect(getClientTelemetryHeaders()).toEqual({
      "x-nextdevtpl-locale": "en",
    });
  });
});
