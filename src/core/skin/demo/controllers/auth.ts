"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { FormEventHandler } from "react";
import { useState } from "react";
import { toast } from "sonner";

import type {
  ForgotPasswordController,
  ResetPasswordController,
  SignInController,
  SignUpController,
  WorkspaceSessionController,
} from "@/features/auth/view";
import type { WorkspaceUser } from "@/features/shared/view";
import { useRouter } from "@/i18n/routing";

import { resolveDemoAssetUrl } from "../projections.js";
import { useDemoStore } from "../store.js";

export function useWorkspaceSessionController(): WorkspaceSessionController {
  const { state, actions } = useDemoStore();
  const router = useRouter();
  const sessionUserId = state.sessionUserId;
  const demoUser = state.data.workspace.user;
  const user: WorkspaceUser | null =
    sessionUserId === null
      ? null
      : {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          image: state.avatarPreview ?? resolveDemoAssetUrl(demoUser.image),
        };

  const onSignOut = async () => {
    actions.signOut();
    await router.replace("/sign-in");
  };

  return { user, onSignOut };
}

export function useSignInController(): SignInController {
  const t = useTranslations("Auth.signIn");
  const router = useRouter();
  const { actions: demoActions } = useDemoStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeSignIn = async () => {
    setIsLoading(true);
    setError(null);
    demoActions.signIn();
    toast.success(t("success"));
    try {
      await router.replace("/dashboard");
    } catch {
      setError(t("errors.invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError(t("errors.missingFields"));
      return;
    }
    await completeSignIn();
  };

  const onGoogleSignIn = async () => {
    await completeSignIn();
  };

  return {
    actions: {
      onEmailChange: setEmail,
      onGoogleSignIn,
      onPasswordChange: setPassword,
      onPasswordVisibilityToggle: () => setPasswordVisible((value) => !value),
      onResendVerificationEmail: async () => undefined,
      onSubmit,
    },
    model: { email, password, passwordVisible },
    state: { error, isLoading, resendCooldown: 0, showResend: false },
  };
}

export function useSignUpController(): SignUpController {
  const t = useTranslations("Auth.signUp");
  const router = useRouter();
  const { actions: demoActions } = useDemoStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailSent = false;

  const completeSignUp = async () => {
    setIsLoading(true);
    setError(null);
    demoActions.signUp();
    toast.success(t("success"));
    try {
      await router.replace("/dashboard");
    } catch {
      setError(t("errors.emailInUse"));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!name || !email || !password) {
      setError(t("errors.missingFields"));
      return;
    }
    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }
    await completeSignUp();
  };

  return {
    actions: {
      onConfirmPasswordChange: setConfirmPassword,
      onEmailChange: setEmail,
      onGoogleSignUp: completeSignUp,
      onNameChange: setName,
      onPasswordChange: setPassword,
      onPasswordVisibilityToggle: () => setPasswordVisible((value) => !value),
      onResendVerificationEmail: async () => undefined,
      onSubmit,
    },
    model: { confirmPassword, email, name, password, passwordVisible },
    state: { emailSent, error, isLoading, resendCooldown: 0 },
  };
}

export function useForgotPasswordController(): ForgotPasswordController {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    await Promise.resolve();
    setIsSuccess(true);
    setIsLoading(false);
  };

  return {
    actions: { onEmailChange: setEmail, onSubmit },
    model: { email },
    state: { error, isLoading, isSuccess },
  };
}

export function useResetPasswordController(): ResetPasswordController {
  const t = useTranslations("Auth.resetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    token ? null : t("invalidLink")
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setIsLoading(true);
    setError(null);
    await Promise.resolve();
    setIsSuccess(true);
    setIsLoading(false);
  };

  return {
    actions: {
      onConfirmPasswordChange: setConfirmPassword,
      onConfirmPasswordVisibilityToggle: () =>
        setConfirmPasswordVisible((value) => !value),
      onPasswordChange: setPassword,
      onPasswordVisibilityToggle: () => setPasswordVisible((value) => !value),
      onSubmit,
    },
    model: {
      confirmPassword,
      confirmPasswordVisible,
      password,
      passwordVisible,
      token,
    },
    state: { error, isLoading, isSuccess },
  };
}
