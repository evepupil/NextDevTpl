"use client";

import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { useResetPasswordController } from "@/features/auth/view";

import { AuthErrorAlert } from "./components/auth-error-alert";

export function ResetPasswordView() {
  const t = useTranslations("Auth.resetPassword");
  const { actions, model, state } = useResetPasswordController();

  if (state.isSuccess) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/15 text-success">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("successTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("successDescription")}
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="underline">{t("backToSignIn")}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AuthErrorAlert message={state.error} />

      {model.token && (
        <form onSubmit={actions.onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={model.passwordVisible ? "text" : "password"}
                value={model.password}
                onChange={(event) =>
                  actions.onPasswordChange(event.target.value)
                }
                disabled={state.isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0"
                onClick={actions.onPasswordVisibilityToggle}
                aria-label={
                  model.passwordVisible ? t("hidePassword") : t("showPassword")
                }
              >
                {model.passwordVisible ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t("confirmPasswordLabel")}
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={model.confirmPasswordVisible ? "text" : "password"}
                value={model.confirmPassword}
                onChange={(event) =>
                  actions.onConfirmPasswordChange(event.target.value)
                }
                disabled={state.isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0"
                onClick={actions.onConfirmPasswordVisibilityToggle}
                aria-label={
                  model.confirmPasswordVisible
                    ? t("hidePassword")
                    : t("showPassword")
                }
              >
                {model.confirmPasswordVisible ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={state.isLoading}>
            {state.isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                {t("loading")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="font-medium hover:underline">
          {t("requestNewLink")}
        </Link>
      </p>
    </div>
  );
}
