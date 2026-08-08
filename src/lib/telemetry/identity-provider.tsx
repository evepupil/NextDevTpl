"use client";

import { useEffect } from "react";

import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES_KEY,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent";
import {
  clearTelemetryIdentity,
  initializeTelemetryIdentity,
} from "./identity";

export function TelemetryIdentityProvider() {
  useEffect(() => {
    const syncIdentity = () => {
      if (hasAnalyticsConsent()) initializeTelemetryIdentity();
      else clearTelemetryIdentity();
    };

    syncIdentity();
    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === COOKIE_CONSENT_KEY ||
        event.key === COOKIE_PREFERENCES_KEY
      ) {
        syncIdentity();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, syncIdentity);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, syncIdentity);
    };
  }, []);

  return null;
}
