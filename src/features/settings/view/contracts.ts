import type { ChangeEvent } from "react";
import type { SubmitHandler, UseFormReturn } from "react-hook-form";

import type { PlanId } from "@/core/plans/contracts";

export interface SettingsPageViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export interface SettingsProfileValues {
  image?: string | undefined;
  name?: string | undefined;
}

export interface SettingsAccountModel {
  avatarUrl: string | undefined;
  locale: string;
  maxAvatarSizeMegabytes: number;
  supportedImageTypes: string;
  user: SettingsPageViewProps["user"];
  form: UseFormReturn<SettingsProfileValues>;
}

export interface SettingsAccountState {
  avatarPreview: string | null;
  isChangingLocale: boolean;
  isDeleteDialogOpen: boolean;
  isDeletingAccount: boolean;
  isProfileSaving: boolean;
  isUploadingAvatar: boolean;
}

export interface SettingsAccountActions {
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteAccount: () => void;
  onLanguageChange: (locale: string) => void;
  onProfileSubmit: SubmitHandler<SettingsProfileValues>;
  setDeleteDialogOpen: (open: boolean) => void;
}

export interface SettingsAccountController {
  actions: SettingsAccountActions;
  model: SettingsAccountModel;
  state: SettingsAccountState;
}

export interface SettingsBillingHistoryItem {
  createdAt: string;
  effectiveAt: string;
  eventType: string;
  fromPlanName: string | null;
  id: string;
  toPlanName: string | null;
}

export interface SettingsBillingModel {
  currentPeriodEnd: string | null;
  currentPlan: PlanId;
  currentPlanName: string;
  history: SettingsBillingHistoryItem[];
  monthlyCredits: number;
  pendingPlan: { name: string } | null;
  pendingPriceEffectiveAt: string | null;
  priceDisplay: string;
  priceInterval: string;
}

export interface SettingsBillingState {
  cancelDialogOpen: boolean;
  isCancelling: boolean;
  isCancelPending: boolean;
}

export interface SettingsBillingActions {
  onCancelSubscription: () => void;
  onResumeSubscription: () => void;
  refreshBilling: () => void;
  setCancelDialogOpen: (open: boolean) => void;
}

export interface SettingsBillingController {
  actions: SettingsBillingActions;
  model: SettingsBillingModel;
  state: SettingsBillingState;
}

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

export interface ViewContracts {
  "settings.page": SettingsPageViewProps;
}
