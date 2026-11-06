"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
  deleteAccountAction,
  updateProfileAction,
} from "@/features/settings/actions";
import { updateProfileSchema } from "@/features/settings/schemas";
import { getSignedUploadUrlAction } from "@/features/storage/actions";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/features/storage/types";
import { generateAvatarKey, getAvatarUrl } from "@/features/storage/utils";
import { usePathname, useRouter } from "@/i18n/routing";
import { signOut } from "@/lib/auth/client";

import type { SettingsPageViewProps } from "./contracts";

type SettingsProfileValues = z.infer<typeof updateProfileSchema>;

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

export function useSettingsAccountController(
  user: SettingsPageViewProps["user"]
): SettingsAccountController {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isChangingLocale, startLocaleTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const form = useForm<SettingsProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name },
  });

  const { execute: executeUpdateProfile, isPending: isProfileSaving } =
    useAction(updateProfileAction, {
      onSuccess: ({ data }) => {
        if (data?.message) {
          toast.success(data.message);
        }
      },
      onError: ({ error }) => {
        if (error.serverError) {
          toast.error(error.serverError);
        }
        if (error.validationErrors) {
          const errors = Object.values(error.validationErrors).flat();
          toast.error(errors.join(", ") || t("errors.validationFailed"));
        }
      },
    });

  const { execute: executeDeleteAccount, isPending: isDeletingAccount } =
    useAction(deleteAccountAction, {
      onSuccess: async ({ data }) => {
        setIsDeleteDialogOpen(false);

        if (data?.message) {
          toast.success(data.message);
        }

        try {
          await signOut({
            fetchOptions: {
              onSuccess: () => {
                router.replace("/");
                router.refresh();
              },
            },
          });
        } catch {
          router.replace("/");
          router.refresh();
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || t("deleteAccount.error"));
      },
    });

  const onLanguageChange = (newLocale: string) => {
    startLocaleTransition(() => {
      router.replace(
        // @ts-expect-error Current route params always match the current pathname.
        { pathname, params },
        { locale: newLocale }
      );
    });
  };

  const onAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      toast.error(
        t("errors.unsupportedFileType", {
          types: ALLOWED_IMAGE_TYPES.join(", "),
        })
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        t("errors.fileTooLarge", { size: MAX_FILE_SIZE / 1024 / 1024 })
      );
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const localPreviewUrl = URL.createObjectURL(file);
      setAvatarPreview(localPreviewUrl);

      const key = generateAvatarKey(user.id, file);
      const uploadUrlResult = await getSignedUploadUrlAction({
        key,
        contentType: file.type as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
      });

      if (!uploadUrlResult?.data?.uploadUrl) {
        throw new Error(t("errors.uploadFailed"));
      }

      const uploadResponse = await fetch(uploadUrlResult.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(t("errors.fileUploadFailed"));
      }

      executeUpdateProfile({ image: uploadUrlResult.data.key });
      toast.success(t("success.avatarUpdated"));
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.avatarUploadError")
      );
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      input.value = "";
    }
  };

  return {
    actions: {
      onAvatarFileChange,
      onDeleteAccount: () => executeDeleteAccount({ confirm: true as const }),
      onLanguageChange,
      onProfileSubmit: (values) => executeUpdateProfile(values),
      setDeleteDialogOpen: setIsDeleteDialogOpen,
    },
    model: {
      avatarUrl: avatarPreview ?? getAvatarUrl(user.image),
      form,
      locale,
      maxAvatarSizeMegabytes: MAX_FILE_SIZE / 1024 / 1024,
      supportedImageTypes: ALLOWED_IMAGE_TYPES.join(","),
      user,
    },
    state: {
      avatarPreview,
      isChangingLocale,
      isDeleteDialogOpen,
      isDeletingAccount,
      isProfileSaving,
      isUploadingAvatar,
    },
  };
}
