"use client";

import { useLocale, useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SettingsPageViewProps } from "@/features/settings/view";
import { useSettingsAccountController } from "@/features/settings/view";

import {
  FormField,
  InlineError,
  SelectInput,
  TextInput,
} from "../shared/fields";

export function AccountSection({ user }: SettingsPageViewProps) {
  const controller = useSettingsAccountController(user);
  const locale = useLocale();
  const t = useTranslations("Settings");
  const form = controller.model.form;
  const copy =
    locale === "zh"
      ? { saving: "保存中...", deleting: "删除中..." }
      : { saving: "Saving...", deleting: "Deleting..." };

  return (
    <section className="grid gap-8" data-section="account">
      <div>
        <h2 className="font-mono text-xl font-semibold">
          {t("general.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("general.description")}
        </p>
        <form
          className="mt-5 grid max-w-xl gap-4"
          onSubmit={form.handleSubmit(controller.actions.onProfileSubmit)}
        >
          <FormField id="settings-name" label={t("general.name")}>
            <TextInput
              autoComplete="name"
              id="settings-name"
              {...form.register("name")}
            />
          </FormField>
          {form.formState.errors.name?.message && (
            <InlineError>{form.formState.errors.name.message}</InlineError>
          )}
          <FormField id="settings-email" label={t("general.email")}>
            <TextInput
              autoComplete="email"
              id="settings-email"
              readOnly
              value={user.email}
            />
          </FormField>
          <Button disabled={controller.state.isProfileSaving} type="submit">
            {controller.state.isProfileSaving ? copy.saving : t("general.save")}
          </Button>
        </form>
      </div>

      <div className="grid gap-3 border-t border-border pt-6">
        <h2 className="font-mono text-xl font-semibold">{t("avatar.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("avatar.supportedFormats", {
            size: controller.model.maxAvatarSizeMegabytes,
          })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {controller.model.avatarUrl && (
            <Avatar className="size-12 rounded-none border border-border">
              <AvatarImage
                alt={user.name}
                className="rounded-none object-cover"
                src={controller.model.avatarUrl}
              />
              <AvatarFallback className="rounded-none font-mono text-xs">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <input
            accept={controller.model.supportedImageTypes}
            aria-label={t("avatar.title")}
            disabled={controller.state.isUploadingAvatar}
            onChange={(event) =>
              void controller.actions.onAvatarFileChange(event)
            }
            type="file"
          />
          {controller.state.isUploadingAvatar && (
            <span aria-live="polite" className="text-xs text-muted-foreground">
              {t("avatar.uploading")}
            </span>
          )}
        </div>
      </div>

      <div className="grid max-w-xl gap-3 border-t border-border pt-6">
        <h2 className="font-mono text-xl font-semibold">
          {t("language.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("language.description")}
        </p>
        <FormField id="settings-language" label={t("language.placeholder")}>
          <SelectInput
            disabled={controller.state.isChangingLocale}
            id="settings-language"
            onChange={(event) =>
              controller.actions.onLanguageChange(event.currentTarget.value)
            }
            value={controller.model.locale}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </SelectInput>
        </FormField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-destructive pt-6">
        <div className="max-w-xl">
          <h2 className="font-mono text-lg font-semibold text-destructive">
            {t("deleteAccount.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("deleteAccount.description")}
          </p>
        </div>
        <Button
          onClick={() => controller.actions.setDeleteDialogOpen(true)}
          type="button"
          variant="destructive"
        >
          {t("deleteAccount.button")}
        </Button>
        <Dialog
          onOpenChange={controller.actions.setDeleteDialogOpen}
          open={controller.state.isDeleteDialogOpen}
        >
          <DialogContent>
            <DialogTitle>{t("deleteAccount.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteAccount.confirmDescription")}
            </DialogDescription>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                onClick={() => controller.actions.setDeleteDialogOpen(false)}
                variant="outline"
              >
                {t("deleteAccount.cancel")}
              </Button>
              <Button
                disabled={controller.state.isDeletingAccount}
                onClick={controller.actions.onDeleteAccount}
                variant="destructive"
              >
                {controller.state.isDeletingAccount
                  ? copy.deleting
                  : t("deleteAccount.confirm")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
