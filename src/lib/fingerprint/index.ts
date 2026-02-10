"use client";

import FingerprintJS, { type GetResult } from "@fingerprintjs/fingerprintjs";

// Singleton promise for the fingerprint agent
let fpPromise: Promise<GetResult> | null = null;

/**
 * Initialize and get the device fingerprint
 *
 * Uses FingerprintJS open source library to generate a visitor ID
 * based on browser characteristics.
 *
 * @returns Promise resolving to the visitor ID string
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    // Initialize the agent at application startup
    if (!fpPromise) {
      fpPromise = FingerprintJS.load().then((fp) => fp.get());
    }

    const result = await fpPromise;
    return result.visitorId;
  } catch (error) {
    console.error("Failed to get device fingerprint:", error);
    return "";
  }
}

/**
 * Get fingerprint and add it to request headers
 *
 * @param headers - Existing headers object to extend
 * @returns Headers object with X-Device-Fingerprint added
 */
export async function addFingerprintHeader(
  headers: Record<string, string> = {}
): Promise<Record<string, string>> {
  const fingerprint = await getDeviceFingerprint();
  if (fingerprint) {
    return {
      ...headers,
      "X-Device-Fingerprint": fingerprint,
    };
  }
  return headers;
}

/**
 * React hook to get the device fingerprint
 *
 * Usage:
 * ```tsx
 * const fingerprint = useDeviceFingerprint();
 * ```
 */
export function useDeviceFingerprint(): string | null {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    getDeviceFingerprint().then(setFingerprint);
  }, []);

  return fingerprint;
}

// Need to import useState and useEffect for the hook
import { useState, useEffect } from "react";
