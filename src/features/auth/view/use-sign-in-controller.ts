"use client";

import { useTranslations } from "next-intl";
import type { FormEventHandler } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { authNavigation } from "@/config/auth-navigation";
import { useRouter } from "@/i18n/routing";
import {
  resendVerificationEmail,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth/client";

import type { SignInController } from "./contracts";
import { useOAuthSuccessFeedback } from "./use-oauth-success-feedback";
import { useResendCooldown } from "./use-resend-cooldown";

export function useSignInController(): SignInController {
  useOAuthSuccessFeedback();
  const t = useTranslations("Auth.signIn");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const { restart, secondsRemaining: resendCooldown } = useResendCooldown();

  const onResendVerificationEmail = async () => {
    if (resendCooldown > 0 || !email) return;

    try {
      await resendVerificationEmail(email);
      restart();
    } catch {
      // 静默失败
    }
  };

  const onGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithGoogle();
      if (result.error) setError(t("errors.google"));
    } catch {
      setError(t("errors.google"));
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

    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithEmail(email, password);

      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          setError(t("errors.emailNotVerified"));
          setShowResend(true);
        } else {
          setError(t("errors.invalidCredentials"));
          setShowResend(false);
        }
        setIsLoading(false);
        return;
      }

      toast.success(t("success"));
      if (authNavigation.afterSignIn) {
        router.replace(authNavigation.afterSignIn);
      } else {
        setIsLoading(false);
      }
    } catch {
      setError(t("errors.invalidCredentials"));
      setIsLoading(false);
    }
  };

  return {
    actions: {
      onEmailChange: setEmail,
      onGoogleSignIn,
      onPasswordChange: setPassword,
      onPasswordVisibilityToggle: () => setPasswordVisible((value) => !value),
      onResendVerificationEmail,
      onSubmit,
    },
    model: { email, password, passwordVisible },
    state: { error, isLoading, resendCooldown, showResend },
  };
}
