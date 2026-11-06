"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEventHandler } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/routing";
import {
  resendVerificationEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth/client";

import type { SignUpController } from "./contracts";
import { useResendCooldown } from "./use-resend-cooldown";

export function useSignUpController(): SignUpController {
  const t = useTranslations("Auth.signUp");
  const tCommon = useTranslations("Auth.common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { restart, secondsRemaining: resendCooldown } = useResendCooldown();

  const onResendVerificationEmail = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendVerificationEmail(email);
      restart();
    } catch {
      // 静默失败，不暴露用户是否存在
    }
  };

  const onGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch {
      setError(t("errors.google"));
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

    try {
      setIsLoading(true);
      setError(null);
      const result = await signUpWithEmail(email, password, name);

      if (result.error) {
        setError(t("errors.emailInUse"));
        setIsLoading(false);
        return;
      }

      if (result.data?.token) {
        toast.success(tCommon("success"));
        router.replace("/dashboard");
        return;
      }

      setEmailSent(true);
      restart();
    } catch {
      setError(t("errors.emailInUse"));
      setIsLoading(false);
    }
  };

  return {
    actions: {
      onConfirmPasswordChange: setConfirmPassword,
      onEmailChange: setEmail,
      onGoogleSignUp,
      onNameChange: setName,
      onPasswordChange: setPassword,
      onPasswordVisibilityToggle: () => setPasswordVisible((value) => !value),
      onResendVerificationEmail,
      onSubmit,
    },
    model: { confirmPassword, email, name, password, passwordVisible },
    state: { emailSent, error, isLoading, resendCooldown },
  };
}
