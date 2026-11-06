"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import {
  getSession,
  OAUTH_SUCCESS_QUERY_PARAM,
  OAUTH_SUCCESS_STORAGE_KEY,
} from "@/lib/auth/client";

function clearOAuthSuccessMarker(parameter: string): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(parameter);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
}

export function useOAuthSuccessFeedback(): void {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const t = useTranslations("Auth.signIn");

  useEffect(() => {
    const callbackState = new URLSearchParams(search).get(
      OAUTH_SUCCESS_QUERY_PARAM
    );
    if (!callbackState) return;

    const clearMarker = () =>
      clearOAuthSuccessMarker(OAUTH_SUCCESS_QUERY_PARAM);
    let expectedState: string | null = null;
    try {
      expectedState = window.sessionStorage.getItem(OAUTH_SUCCESS_STORAGE_KEY);
    } catch {
      clearMarker();
      return;
    }

    if (!expectedState || expectedState !== callbackState) {
      clearMarker();
      return;
    }

    let active = true;
    void getSession()
      .then(({ data }) => {
        if (!active || !data?.user) return;

        try {
          if (
            window.sessionStorage.getItem(OAUTH_SUCCESS_STORAGE_KEY) !==
            callbackState
          ) {
            clearMarker();
            return;
          }
          window.sessionStorage.removeItem(OAUTH_SUCCESS_STORAGE_KEY);
        } catch {
          clearMarker();
          return;
        }

        clearMarker();
        toast.success(t("success"));
      })
      .catch(() => {
        // 暂时读不到会话时保留标记，下次进入页面可继续确认。
      });

    return () => {
      active = false;
    };
  }, [search, t]);
}
