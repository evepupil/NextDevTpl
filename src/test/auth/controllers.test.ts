// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useForgotPasswordController,
  useResetPasswordController,
  useSignInController,
  useSignUpController,
} from "@/features/auth/view";
import {
  forgetPassword,
  resendVerificationEmail,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth/client";
import englishMessages from "../../../messages/en.json";
import chineseMessages from "../../../messages/zh.json";

const mocks = vi.hoisted(() => ({
  forgetPassword: vi.fn(),
  getSession: vi.fn(),
  resendVerificationEmail: vi.fn(),
  resetPassword: vi.fn(),
  router: { replace: vi.fn() },
  search: "token=reset-token",
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUpWithEmail: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/auth/client", () => ({
  OAUTH_SUCCESS_QUERY_PARAM: "oauthSuccess",
  OAUTH_SUCCESS_STORAGE_KEY: "nextdevtpl:oauth-success-state",
  forgetPassword: mocks.forgetPassword,
  getSession: mocks.getSession,
  resendVerificationEmail: mocks.resendVerificationEmail,
  resetPassword: mocks.resetPassword,
  signInWithEmail: mocks.signInWithEmail,
  signInWithGoogle: mocks.signInWithGoogle,
  signUpWithEmail: mocks.signUpWithEmail,
}));

vi.mock("@/i18n/routing", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

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
  mocks.search = "token=reset-token";
  mocks.signInWithEmail.mockResolvedValue({} as never);
  mocks.signInWithGoogle.mockResolvedValue({} as never);
  mocks.signUpWithEmail.mockResolvedValue({} as never);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("auth success translations", () => {
  it.each([
    { locale: "en", messages: englishMessages },
    { locale: "zh", messages: chineseMessages },
  ])("defines sign-in and sign-up success text for $locale", ({ messages }) => {
    expect(messages.Auth.signIn.success.trim()).not.toBe("");
    expect(messages.Auth.signUp.success.trim()).not.toBe("");
  });
});

describe("sign-in controller", () => {
  it("rejects empty fields before calling the authentication client", async () => {
    const { result } = renderHook(() => useSignInController());

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.signInWithEmail).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe("Auth.signIn.errors.missingFields");
  });

  it("shows the verification state for an unverified account", async () => {
    vi.mocked(signInWithEmail).mockResolvedValueOnce({
      error: { code: "EMAIL_NOT_VERIFIED" },
    } as never);
    const { result } = renderHook(() => useSignInController());
    act(() => {
      result.current.actions.onEmailChange("person@example.com");
      result.current.actions.onPasswordChange("password");
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.signInWithEmail).toHaveBeenCalledWith(
      "person@example.com",
      "password"
    );
    expect(result.current.state.error).toBe(
      "Auth.signIn.errors.emailNotVerified"
    );
    expect(result.current.state.showResend).toBe(true);
    expect(result.current.state.isLoading).toBe(false);
  });

  it("reports successful email sign-in and navigates to the dashboard", async () => {
    vi.mocked(signInWithEmail).mockResolvedValueOnce({} as never);
    const { result } = renderHook(() => useSignInController());
    act(() => {
      result.current.actions.onEmailChange("person@example.com");
      result.current.actions.onPasswordChange("password");
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith("Auth.signIn.success");
    expect(mocks.router.replace).toHaveBeenCalledWith("/dashboard");
    expect(result.current.state.error).toBeNull();
  });

  it("keeps the submitting state during a request and clears it after a rejection", async () => {
    const request = deferred<Awaited<ReturnType<typeof signInWithEmail>>>();
    vi.mocked(signInWithEmail).mockReturnValueOnce(request.promise);
    const { result } = renderHook(() => useSignInController());
    act(() => {
      result.current.actions.onEmailChange("person@example.com");
      result.current.actions.onPasswordChange("password");
    });

    let submission: void | Promise<void>;
    act(() => {
      submission = result.current.actions.onSubmit(submitEvent());
    });
    expect(result.current.state.isLoading).toBe(true);

    await act(async () => {
      request.reject(new Error("network unavailable"));
      await submission;
    });

    expect(result.current.state.error).toBe(
      "Auth.signIn.errors.invalidCredentials"
    );
    expect(result.current.state.isLoading).toBe(false);
  });

  it("reports Google sign-in failures", async () => {
    vi.mocked(signInWithGoogle).mockRejectedValueOnce(
      new Error("OAuth failed")
    );
    const { result } = renderHook(() => useSignInController());

    await act(async () => {
      await result.current.actions.onGoogleSignIn();
    });

    expect(mocks.signInWithGoogle).toHaveBeenCalledOnce();
    expect(result.current.state.error).toBe("Auth.signIn.errors.google");
    expect(result.current.state.isLoading).toBe(false);
  });

  it("reports resolved Google sign-in errors and clears loading", async () => {
    vi.mocked(signInWithGoogle).mockResolvedValueOnce({
      error: { message: "OAuth failed" },
    } as never);
    const { result } = renderHook(() => useSignInController());

    await act(async () => {
      await result.current.actions.onGoogleSignIn();
    });

    expect(result.current.state.error).toBe("Auth.signIn.errors.google");
    expect(result.current.state.isLoading).toBe(false);
  });
});

describe("sign-up controller", () => {
  it.each([
    {
      expectedError: "Auth.signUp.errors.missingFields",
      values: { email: "", name: "", password: "", confirmPassword: "" },
    },
    {
      expectedError: "Auth.signUp.errors.passwordTooShort",
      values: {
        email: "person@example.com",
        name: "Alex",
        password: "short",
        confirmPassword: "short",
      },
    },
    {
      expectedError: "Auth.signUp.errors.passwordMismatch",
      values: {
        email: "person@example.com",
        name: "Alex",
        password: "password1",
        confirmPassword: "password2",
      },
    },
  ])("rejects invalid fields with $expectedError", async ({
    expectedError,
    values,
  }) => {
    const { result } = renderHook(() => useSignUpController());
    act(() => {
      result.current.actions.onNameChange(values.name);
      result.current.actions.onEmailChange(values.email);
      result.current.actions.onPasswordChange(values.password);
      result.current.actions.onConfirmPasswordChange(values.confirmPassword);
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.signUpWithEmail).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe(expectedError);
  });

  it("navigates immediately when registration returns a session token", async () => {
    vi.mocked(signUpWithEmail).mockResolvedValueOnce({
      data: { token: "session-token" },
    } as never);
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

    expect(mocks.signUpWithEmail).toHaveBeenCalledWith(
      "person@example.com",
      "password1",
      "Alex Morgan"
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Auth.signUp.success");
    expect(mocks.router.replace).toHaveBeenCalledWith("/dashboard");
    expect(result.current.state.emailSent).toBe(false);
  });

  it("shows the email-verification branch and starts a resend cooldown", async () => {
    vi.mocked(signUpWithEmail).mockResolvedValueOnce({ data: {} } as never);
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
    expect(result.current.state.resendCooldown).toBe(60);
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });

  it("allows resend after 60 seconds and blocks another resend during cooldown", async () => {
    vi.useFakeTimers();
    vi.mocked(signUpWithEmail).mockResolvedValueOnce({ data: {} } as never);
    vi.mocked(resendVerificationEmail).mockResolvedValue({} as never);
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

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(result.current.state.resendCooldown).toBe(0);

    await act(async () => {
      await result.current.actions.onResendVerificationEmail();
    });
    expect(mocks.resendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(mocks.resendVerificationEmail).toHaveBeenCalledWith(
      "person@example.com"
    );
    expect(result.current.state.resendCooldown).toBe(60);

    await act(async () => {
      await result.current.actions.onResendVerificationEmail();
    });
    expect(mocks.resendVerificationEmail).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    await act(async () => {
      await result.current.actions.onResendVerificationEmail();
    });
    expect(mocks.resendVerificationEmail).toHaveBeenCalledTimes(2);
  });

  it("reports registration service failures", async () => {
    vi.mocked(signUpWithEmail).mockResolvedValueOnce({
      error: { message: "duplicate account" },
    } as never);
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

    expect(result.current.state.error).toBe("Auth.signUp.errors.emailInUse");
    expect(result.current.state.isLoading).toBe(false);
  });

  it("reports resolved Google sign-up errors and clears loading", async () => {
    vi.mocked(signInWithGoogle).mockResolvedValueOnce({
      error: { message: "OAuth failed" },
    } as never);
    const { result } = renderHook(() => useSignUpController());

    await act(async () => {
      await result.current.actions.onGoogleSignUp();
    });

    expect(result.current.state.error).toBe("Auth.signUp.errors.google");
    expect(result.current.state.isLoading).toBe(false);
  });
});

describe("forgot-password controller", () => {
  it("rejects empty email without calling the auth client", async () => {
    const { result } = renderHook(() => useForgotPasswordController());

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.forgetPassword).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe("Please enter your email address");
  });

  it("sends the reset email and reports success", async () => {
    vi.mocked(forgetPassword).mockResolvedValueOnce({} as never);
    const { result } = renderHook(() => useForgotPasswordController());
    act(() => result.current.actions.onEmailChange("person@example.com"));

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.forgetPassword).toHaveBeenCalledWith(
      "person@example.com",
      "/reset-password"
    );
    expect(result.current.state.isSuccess).toBe(true);
    expect(result.current.state.isLoading).toBe(false);
  });

  it("reports reset-email service failures", async () => {
    vi.mocked(forgetPassword).mockRejectedValueOnce(
      new Error("request failed")
    );
    const { result } = renderHook(() => useForgotPasswordController());
    act(() => result.current.actions.onEmailChange("person@example.com"));

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(result.current.state.error).toBe(
      "Failed to send reset link. Please try again."
    );
    expect(result.current.state.isLoading).toBe(false);
  });
});

describe("reset-password controller", () => {
  it("does not call reset without a token", async () => {
    mocks.search = "";
    const { result } = renderHook(() => useResetPasswordController());

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.resetPassword).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe("Auth.resetPassword.invalidLink");
  });

  it.each([
    {
      error: "Auth.resetPassword.passwordTooShort",
      password: "short",
      confirmation: "short",
    },
    {
      error: "Auth.resetPassword.passwordMismatch",
      password: "password1",
      confirmation: "password2",
    },
  ])("rejects invalid reset values with $error", async ({
    error,
    password,
    confirmation,
  }) => {
    const { result } = renderHook(() => useResetPasswordController());
    act(() => {
      result.current.actions.onPasswordChange(password);
      result.current.actions.onConfirmPasswordChange(confirmation);
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.resetPassword).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe(error);
  });

  it("submits the matching password with its token and reports success", async () => {
    vi.mocked(resetPassword).mockResolvedValueOnce({} as never);
    const { result } = renderHook(() => useResetPasswordController());
    act(() => {
      result.current.actions.onPasswordChange("password1");
      result.current.actions.onConfirmPasswordChange("password1");
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.resetPassword).toHaveBeenCalledWith(
      "password1",
      "reset-token"
    );
    expect(result.current.state.isSuccess).toBe(true);
    expect(result.current.state.isLoading).toBe(false);
  });

  it("reports reset-password service failures", async () => {
    vi.mocked(resetPassword).mockRejectedValueOnce(new Error("request failed"));
    const { result } = renderHook(() => useResetPasswordController());
    act(() => {
      result.current.actions.onPasswordChange("password1");
      result.current.actions.onConfirmPasswordChange("password1");
    });

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(result.current.state.error).toBe("Auth.resetPassword.error");
    expect(result.current.state.isLoading).toBe(false);
  });
});

describe("verification-email cooldown", () => {
  it("counts down from 60 seconds, reopens resend, and clears its timer on unmount", async () => {
    vi.useFakeTimers();
    vi.mocked(resendVerificationEmail).mockResolvedValue({} as never);
    const { result, unmount } = renderHook(() => useSignInController());
    act(() => result.current.actions.onEmailChange("person@example.com"));

    await act(async () => {
      await result.current.actions.onResendVerificationEmail();
    });
    expect(result.current.state.resendCooldown).toBe(60);
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(59_000);
    });
    expect(result.current.state.resendCooldown).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current.state.resendCooldown).toBe(0);
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      await result.current.actions.onResendVerificationEmail();
    });
    expect(result.current.state.resendCooldown).toBe(60);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
