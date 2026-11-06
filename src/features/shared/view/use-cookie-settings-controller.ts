"use client";

import { useCallback, useEffect, useState } from "react";

import {
  COOKIE_CONSENT_CHANGE_EVENT,
  COOKIE_CONSENT_KEY,
  COOKIE_PREFERENCES_KEY,
  type CookieConsentType,
  type CookiePreferences,
} from "@/lib/cookie-consent";

import type { CookieCategoryId, CookieSettingsController } from "./contracts";

const DEFAULT_PREFERENCES: CookiePreferences = {
  analytics: true,
  marketing: true,
};

export function useCookieSettingsController(): CookieSettingsController {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [expandedItems, setExpandedItems] = useState<CookieCategoryId[]>([
    "necessary",
  ]);

  useEffect(() => {
    if (!open) return;
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!savedPreferences) return;

    try {
      setPreferences(JSON.parse(savedPreferences) as CookiePreferences);
    } catch {
      // Ignore malformed preferences and keep defaults.
    }
  }, [open]);

  const toggleExpanded = (id: CookieCategoryId) => {
    setExpandedItems((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const saveConsent = useCallback(
    (consent: CookieConsentType, value: CookiePreferences) => {
      localStorage.setItem(COOKIE_CONSENT_KEY, consent || "");
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT));
      setOpen(false);
    },
    []
  );

  const onAcceptAll = useCallback(() => {
    const allPreferences: CookiePreferences = {
      analytics: true,
      marketing: true,
    };
    setPreferences(allPreferences);
    saveConsent("all", allPreferences);
  }, [saveConsent]);

  const onRejectAll = useCallback(() => {
    const essentialPreferences: CookiePreferences = {
      analytics: false,
      marketing: false,
    };
    setPreferences(essentialPreferences);
    saveConsent("essential", essentialPreferences);
  }, [saveConsent]);

  const onSavePreferences = useCallback(() => {
    const consent: CookieConsentType =
      preferences.analytics || preferences.marketing ? "all" : "essential";
    saveConsent(consent, preferences);
  }, [preferences, saveConsent]);

  const getCategoryValue = (id: CookieCategoryId): boolean => {
    if (id === "necessary") return true;
    if (id === "analytics") return preferences.analytics;
    return preferences.marketing;
  };

  const onCategoryChange = (id: CookieCategoryId, value: boolean) => {
    if (id === "analytics") {
      setPreferences((previous) => ({ ...previous, analytics: value }));
    }
    if (id === "marketing") {
      setPreferences((previous) => ({ ...previous, marketing: value }));
    }
  };

  return {
    open,
    onOpenChange: setOpen,
    preferences,
    expandedItems,
    toggleExpanded,
    getCategoryValue,
    onCategoryChange,
    onAcceptAll,
    onRejectAll,
    onSavePreferences,
  };
}
