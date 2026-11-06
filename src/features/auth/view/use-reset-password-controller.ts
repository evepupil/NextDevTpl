"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEventHandler } from "react";

import { resetPassword } from "@/lib/auth/client";

import type { ResetPasswordController } from "./contracts";

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

    try {
      setIsLoading(true);
      setError(null);
      await resetPassword(password, token);
      setIsSuccess(true);
    } catch {
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
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
