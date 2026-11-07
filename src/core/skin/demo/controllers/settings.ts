"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PLAN_CATALOG } from "@/core/plans/catalog.js";
import type {
  SettingsAccountController,
  SettingsBillingController,
  SettingsPageViewProps,
  SettingsProfileValues,
  SettingsSecurityController,
} from "@/features/settings/view";
import type { Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/routing";

import { projectBillingHistory, resolveDemoAssetUrl } from "../projections.js";
import { useDemoStore } from "../store.js";

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function useSettingsAccountController(
  _initialUser: SettingsPageViewProps["user"]
): SettingsAccountController {
  const t = useTranslations("Settings");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { state, actions } = useDemoStore();
  const demoUser = state.data.workspace.user;
  const [isChangingLocale, startLocaleTransition] = useTransition();
  const [isProfileSaving, startProfileTransition] = useTransition();
  const [isDeletingAccount, startDeleteTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const form = useForm<SettingsProfileValues>({
    defaultValues: { name: demoUser.name },
  });

  const onAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (
      !ALLOWED_AVATAR_TYPES.includes(
        file.type as (typeof ALLOWED_AVATAR_TYPES)[number]
      )
    ) {
      toast.error(
        t("errors.unsupportedFileType", {
          types: ALLOWED_AVATAR_TYPES.join(", "),
        })
      );
      input.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error(
        t("errors.fileTooLarge", { size: MAX_AVATAR_SIZE / 1024 / 1024 })
      );
      input.value = "";
      return;
    }

    setIsUploadingAvatar(true);
    try {
      actions.setAvatarPreview(URL.createObjectURL(file));
      toast.success(t("success.avatarUpdated"));
    } catch {
      toast.error(t("errors.avatarUploadError"));
    } finally {
      setIsUploadingAvatar(false);
      input.value = "";
    }
  };

  return {
    actions: {
      onAvatarFileChange,
      onDeleteAccount: () => {
        startDeleteTransition(() => {
          actions.deleteAccount();
          setIsDeleteDialogOpen(false);
          router.replace("/sign-in");
        });
      },
      onLanguageChange: (newLocale) => {
        startLocaleTransition(() => {
          router.replace(
            // @ts-expect-error 当前路由参数与 pathname 匹配。
            { pathname, params },
            { locale: newLocale }
          );
        });
      },
      onProfileSubmit: (values) => {
        const name = values.name?.trim();
        if (!name || name.length < 2) {
          form.setError("name", {
            type: "validate",
            message: t("errors.validationFailed"),
          });
          return;
        }
        if (name.length > 50) {
          form.setError("name", {
            type: "validate",
            message: t("errors.validationFailed"),
          });
          return;
        }
        form.clearErrors("name");
        form.setValue("name", name);
        startProfileTransition(() => {
          actions.updateProfile({ name });
        });
      },
      setDeleteDialogOpen: setIsDeleteDialogOpen,
    },
    model: {
      avatarUrl:
        state.avatarPreview ?? resolveDemoAssetUrl(demoUser.image) ?? undefined,
      form,
      locale,
      maxAvatarSizeMegabytes: MAX_AVATAR_SIZE / 1024 / 1024,
      supportedImageTypes: ALLOWED_AVATAR_TYPES.join(","),
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        image: resolveDemoAssetUrl(demoUser.image),
      },
    },
    state: {
      avatarPreview: state.avatarPreview,
      isChangingLocale,
      isDeleteDialogOpen,
      isDeletingAccount,
      isProfileSaving,
      isUploadingAvatar,
    },
  };
}

export function useSettingsBillingController(): SettingsBillingController {
  const t = useTranslations("Settings.billing");
  const { state, actions } = useDemoStore();
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const plan = state.data.workspace.plan;
  const currentPlan = PLAN_CATALOG.plans[plan.id];
  const currentPrice = currentPlan.prices[plan.interval];

  return {
    actions: {
      onCancelSubscription: () => {
        if (plan.id === "free" || !plan.isActive || plan.cancelAtPeriodEnd) {
          return;
        }
        startCancelTransition(() => {
          actions.cancelSubscription();
          setCancelDialogOpen(false);
          toast.success(t("currentPlan.cancelSuccess"));
        });
      },
      onResumeSubscription: () => {
        if (plan.id === "free" || !plan.cancelAtPeriodEnd) return;
        startCancelTransition(() => {
          actions.resumeSubscription();
          toast.success(t("currentPlan.resumeSuccess"));
        });
      },
      refreshBilling: () => undefined,
      setCancelDialogOpen,
    },
    model: {
      currentPeriodEnd: plan.currentPeriodEnd,
      currentPlan: plan.id,
      currentPlanName: currentPlan.name,
      history: projectBillingHistory(state.data),
      monthlyCredits: currentPlan.monthlyCredits,
      pendingPlan: plan.pendingPlanId
        ? { name: PLAN_CATALOG.plans[plan.pendingPlanId].name }
        : null,
      pendingPriceEffectiveAt: plan.pendingPriceEffectiveAt,
      priceDisplay: plan.id === "free" ? "$0" : `$${currentPrice}`,
      priceInterval:
        plan.interval === "year"
          ? t("currentPlan.perYear")
          : t("currentPlan.perMonth"),
    },
    state: {
      cancelDialogOpen,
      isCancelling,
      isCancelPending: plan.cancelAtPeriodEnd,
    },
  };
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

    setIsLoading(true);
    try {
      await Promise.resolve();
      toast.success(t("success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
