"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useSettingsSecurityController } from "@/features/settings/view";

import { FormField, InlineError, TextInput } from "../shared/fields";

export function SecuritySection() {
  const controller = useSettingsSecurityController();
  const t = useTranslations("Settings.security");
  const tPassword = useTranslations("Auth.resetPassword");
  const inputType = controller.model.showPasswords ? "text" : "password";

  return (
    <section className="max-w-xl" data-section="security">
      <h2 className="font-mono text-xl font-semibold">
        {t("changePassword.title")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("changePassword.description")}
      </p>
      <div className="mt-5 grid gap-4">
        <FormField
          id="current-password"
          label={t("changePassword.currentPassword")}
        >
          <TextInput
            autoComplete="current-password"
            id="current-password"
            onChange={(event) =>
              controller.actions.setCurrentPassword(event.currentTarget.value)
            }
            placeholder={t("changePassword.currentPasswordPlaceholder")}
            type={inputType}
            value={controller.model.currentPassword}
          />
        </FormField>
        <FormField id="new-password" label={t("changePassword.newPassword")}>
          <TextInput
            autoComplete="new-password"
            id="new-password"
            onChange={(event) =>
              controller.actions.setNewPassword(event.currentTarget.value)
            }
            placeholder={t("changePassword.newPasswordPlaceholder")}
            type={inputType}
            value={controller.model.newPassword}
          />
        </FormField>
        <FormField
          id="confirm-new-password"
          label={t("changePassword.confirmPassword")}
        >
          <TextInput
            autoComplete="new-password"
            id="confirm-new-password"
            onChange={(event) =>
              controller.actions.setConfirmPassword(event.currentTarget.value)
            }
            placeholder={t("changePassword.confirmPasswordPlaceholder")}
            type={inputType}
            value={controller.model.confirmPassword}
          />
        </FormField>
        <Button
          aria-pressed={controller.model.showPasswords}
          onClick={controller.actions.toggleShowPasswords}
          type="button"
          variant="outline"
        >
          {controller.model.showPasswords
            ? tPassword("hidePassword")
            : tPassword("showPassword")}
        </Button>
        {controller.state.error && (
          <InlineError>{controller.state.error}</InlineError>
        )}
        <Button
          disabled={controller.state.isLoading}
          onClick={() => void controller.actions.onChangePassword()}
          type="button"
        >
          {controller.state.isLoading
            ? t("changePassword.updating")
            : t("changePassword.submit")}
        </Button>
      </div>
    </section>
  );
}
