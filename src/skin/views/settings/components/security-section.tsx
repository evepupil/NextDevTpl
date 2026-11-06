"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsSecurityController } from "@/features/settings/view";

export function SecuritySection() {
  const t = useTranslations("Settings.security");
  const { actions, model, state } = useSettingsSecurityController();

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {t("changePassword.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("changePassword.description")}
            </p>
          </div>
          <Button
            size="sm"
            disabled={
              state.isLoading ||
              !model.currentPassword ||
              !model.newPassword ||
              !model.confirmPassword
            }
            onClick={actions.onChangePassword}
          >
            {state.isLoading
              ? t("changePassword.updating")
              : t("changePassword.submit")}
          </Button>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">
              {t("changePassword.currentPassword")}
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={model.showPasswords ? "text" : "password"}
                placeholder={t("changePassword.currentPasswordPlaceholder")}
                value={model.currentPassword}
                onChange={(event) =>
                  actions.setCurrentPassword(event.target.value)
                }
                disabled={state.isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={actions.toggleShowPasswords}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {model.showPasswords ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {t("changePassword.newPassword")}
            </Label>
            <Input
              id="new-password"
              type={model.showPasswords ? "text" : "password"}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              value={model.newPassword}
              onChange={(event) => actions.setNewPassword(event.target.value)}
              disabled={state.isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t("changePassword.confirmPassword")}
            </Label>
            <Input
              id="confirm-password"
              type={model.showPasswords ? "text" : "password"}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              value={model.confirmPassword}
              onChange={(event) =>
                actions.setConfirmPassword(event.target.value)
              }
              disabled={state.isLoading}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
