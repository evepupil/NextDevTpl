"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { changePassword } from "@/lib/auth/client";

export interface SettingsSecurityModel {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
  showPasswords: boolean;
}

export interface SettingsSecurityState {
  error: string | null;
  isLoading: boolean;
}

export interface SettingsSecurityActions {
  onChangePassword: () => Promise<void>;
  setConfirmPassword: (value: string) => void;
  setCurrentPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  toggleShowPasswords: () => void;
}

export interface SettingsSecurityController {
  actions: SettingsSecurityActions;
  model: SettingsSecurityModel;
  state: SettingsSecurityState;
}

export function useSettingsSecurityController(): SettingsSecurityController {
  const t = useTranslations("Settings.security");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChangePassword = async () => {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("errors.missingFields"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    if (currentPassword === newPassword) {
      setError(t("errors.samePassword"));
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword);
      toast.success(t("success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError(t("errors.wrongPassword"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    actions: {
      onChangePassword,
      setConfirmPassword,
      setCurrentPassword,
      setNewPassword,
      toggleShowPasswords: () => setShowPasswords((value) => !value),
    },
    model: {
      confirmPassword,
      currentPassword,
      newPassword,
      showPasswords,
    },
    state: { error, isLoading },
  };
}
