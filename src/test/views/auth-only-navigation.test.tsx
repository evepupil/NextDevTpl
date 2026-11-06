// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import type { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useSignInController,
  useSignUpController,
  useWorkspaceSessionController,
} from "@/features/auth/view";
import { useOAuthSuccessFeedback } from "../../features/auth/view/use-oauth-success-feedback";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  navigateAfterSignOut: vi.fn(),
  router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
  search: "",
  session: { data: { user: { email: "person@example.com", id: "user-1" } } },
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  signUpWithEmail: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/config/auth-navigation", () => ({
  authNavigation: { afterSignIn: null, afterSignOut: "/sign-in" },
}));

vi.mock("@/lib/auth/client", () => ({
  OAUTH_SUCCESS_QUERY_PARAM: "oauthSuccess",
  OAUTH_SUCCESS_STORAGE_KEY: "nextdevtpl:oauth-success-state",
  getSession: mocks.getSession,
  resendVerificationEmail: vi.fn(),
  signInWithEmail: mocks.signInWithEmail,
  signInWithGoogle: mocks.signInWithGoogle,
  signOut: mocks.signOut,
  signUpWithEmail: mocks.signUpWithEmail,
  useSession: () => mocks.session,
}));
vi.mock("@/lib/auth/navigation", () => ({
  navigateAfterSignOut: mocks.navigateAfterSignOut,
}));

vi.mock("@/i18n/routing", () => ({ useRouter: () => mocks.router }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("next-intl", () => ({
  useLocale: () => "zh",
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess } }));

function submitEvent(): FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = "";
  mocks.session = {
    data: { user: { email: "person@example.com", id: "user-1" } },
  };
  mocks.getSession.mockResolvedValue({ data: { user: { id: "oauth-user" } } });
  mocks.signInWithEmail.mockResolvedValue({});
  mocks.signUpWithEmail.mockResolvedValue({ data: { token: "session-token" } });
  mocks.signOut.mockImplementation(
    async (options: { fetchOptions: { onSuccess: () => void } }) =>
      options.fetchOptions.onSuccess()
  );
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/zh/sign-in");
});

describe("auth-only destinations", () => {
  it("keeps successful email sign-in on the page and restores the form", async () => {
    const { result } = renderHook(() => useSignInController());
    act(() => {
      result.current.actions.onEmailChange("person@example.com");
      result.current.actions.onPasswordChange("password");
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith("Auth.signIn.success");
    expect(mocks.router.replace).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
  });

  it("keeps successful registration on the page and restores the form", async () => {
    const { result } = renderHook(() => useSignUpController());
    act(() => {
      result.current.actions.onNameChange("Alex Morgan");
      result.current.actions.onEmailChange("person@example.com");
      result.current.actions.onPasswordChange("password1");
      result.current.actions.onConfirmPasswordChange("password1");
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith("Auth.signUp.success");
    expect(mocks.router.replace).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
  });

  it("restores the registration form after sending a verification email", async () => {
    mocks.signUpWithEmail.mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useSignUpController());
    act(() => {
      result.current.actions.onNameChange("Alex Morgan");
      result.current.actions.onEmailChange("person@example.com");
      result.current.actions.onPasswordChange("password1");
      result.current.actions.onConfirmPasswordChange("password1");
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(result.current.state.emailSent).toBe(true);
    expect(result.current.state.isLoading).toBe(false);
  });

  it("discards a forged OAuth marker without checking or announcing a session", async () => {
    mocks.search = "oauthSuccess=forged";
    window.history.replaceState(null, "", "/zh/sign-in?oauthSuccess=forged");

    renderHook(() => useOAuthSuccessFeedback());

    await waitFor(() => expect(window.location.search).toBe(""));

    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("announces a matching OAuth return only after a real session is found", async () => {
    const state = "oauth-state-123";
    window.sessionStorage.setItem("nextdevtpl:oauth-success-state", state);
    mocks.search = `oauthSuccess=${state}&tab=account`;
    window.history.replaceState(
      null,
      "",
      `/zh/sign-in?oauthSuccess=${state}&tab=account`
    );

    const { rerender } = renderHook(() => useOAuthSuccessFeedback());

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith("Auth.signIn.success")
    );
    expect(mocks.getSession).toHaveBeenCalledOnce();
    expect(
      window.sessionStorage.getItem("nextdevtpl:oauth-success-state")
    ).toBe(null);
    expect(
      new URLSearchParams(window.location.search).get("oauthSuccess")
    ).toBe(null);
    expect(new URLSearchParams(window.location.search).get("tab")).toBe(
      "account"
    );

    mocks.search = `oauthSuccess=${state}&repeat=1`;
    rerender();
    await waitFor(() =>
      expect(
        new URLSearchParams(window.location.search).get("oauthSuccess")
      ).toBe(null)
    );
    expect(mocks.getSession).toHaveBeenCalledOnce();
    expect(mocks.toastSuccess).toHaveBeenCalledOnce();
  });

  it.each([
    "session absent",
    "session request rejected",
  ] as const)("retains the one-time marker after %s and retries after remount", async (failureMode) => {
    const state = "oauth-state-without-session";
    window.sessionStorage.setItem("nextdevtpl:oauth-success-state", state);
    mocks.search = `oauthSuccess=${state}`;
    window.history.replaceState(null, "", `/zh/sign-in?oauthSuccess=${state}`);
    const firstRequest = deferred<{
      data: { user?: { id: string } } | null;
    }>();
    mocks.getSession.mockReturnValueOnce(firstRequest.promise);

    const firstMount = renderHook(() => useOAuthSuccessFeedback());
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalledOnce());

    if (failureMode === "session absent") {
      await act(async () => {
        firstRequest.resolve({ data: null });
        await firstRequest.promise;
      });
    } else {
      await act(async () => {
        firstRequest.reject(new Error("Temporary session lookup failure"));
        await firstRequest.promise.catch(() => undefined);
      });
    }

    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem("nextdevtpl:oauth-success-state")
    ).toBe(state);
    expect(
      new URLSearchParams(window.location.search).get("oauthSuccess")
    ).toBe(state);
    firstMount.unmount();

    mocks.getSession.mockResolvedValueOnce({
      data: { user: { id: "oauth-user" } },
    });
    const retryMount = renderHook(() => useOAuthSuccessFeedback());
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledOnce());

    expect(mocks.getSession).toHaveBeenCalledTimes(2);
    expect(
      window.sessionStorage.getItem("nextdevtpl:oauth-success-state")
    ).toBe(null);
    expect(
      new URLSearchParams(window.location.search).get("oauthSuccess")
    ).toBe(null);
    retryMount.unmount();

    const replayMount = renderHook(() => useOAuthSuccessFeedback());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.getSession).toHaveBeenCalledTimes(2);
    expect(mocks.toastSuccess).toHaveBeenCalledOnce();
    replayMount.unmount();
  });

  it("uses a full localized navigation after a successful sign-out", async () => {
    const { result } = renderHook(() => useWorkspaceSessionController());

    await act(async () => result.current.onSignOut());

    expect(mocks.navigateAfterSignOut).toHaveBeenCalledWith("zh");
    expect(mocks.router.push).not.toHaveBeenCalled();
  });
});
