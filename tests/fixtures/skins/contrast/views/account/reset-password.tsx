"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useResetPasswordController } from "@/features/auth/view";
import { Link } from "@/i18n/routing";

import { FormField, InlineError, TextInput } from "../shared/fields";

export function ResetPasswordView() {
  const controller = useResetPasswordController();
  const t = useTranslations("Auth.resetPassword");
  if (!controller.model.token) {
    return (
      <section
        aria-live="polite"
        className="max-w-lg border-y border-border py-8"
        data-skin-view="auth.reset-password"
      >
        <h1 className="mb-4 font-mono text-xl font-semibold">{t("title")}</h1>
        <InlineError>{controller.state.error ?? t("invalidLink")}</InlineError>
        <Link
          className="mt-5 inline-block text-primary underline-offset-4 hover:underline"
          href="/forgot-password"
        >
          {t("requestNewLink")}
        </Link>
      </section>
    );
  }
  if (controller.state.isSuccess) {
    return (
      <section
        aria-live="polite"
        className="max-w-lg border-y border-border py-8"
        data-skin-view="auth.reset-password"
      >
        <h1 className="font-mono text-xl font-semibold">{t("successTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("successDescription")}
        </p>
        <Link
          className="mt-5 inline-block text-primary underline-offset-4 hover:underline"
          href="/sign-in"
        >
          {t("backToSignIn")}
        </Link>
      </section>
    );
  }
  return (
    <div className="max-w-lg" data-skin-view="auth.reset-password">
      <h1 className="font-mono text-2xl font-semibold">{t("title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <form className="grid gap-4" onSubmit={controller.actions.onSubmit}>
        <FormField id="reset-password" label={t("passwordLabel")}>
          <TextInput
            autoComplete="new-password"
            id="reset-password"
            onChange={(event) =>
              controller.actions.onPasswordChange(event.currentTarget.value)
            }
            required
            type={controller.model.passwordVisible ? "text" : "password"}
            value={controller.model.password}
          />
        </FormField>
        <FormField id="reset-confirm" label={t("confirmPasswordLabel")}>
          <TextInput
            autoComplete="new-password"
            id="reset-confirm"
            onChange={(event) =>
              controller.actions.onConfirmPasswordChange(
                event.currentTarget.value
              )
            }
            required
            type={controller.model.confirmPasswordVisible ? "text" : "password"}
            value={controller.model.confirmPassword}
          />
        </FormField>
        <Button
          aria-pressed={
            controller.model.passwordVisible &&
            controller.model.confirmPasswordVisible
          }
          onClick={() => {
            controller.actions.onPasswordVisibilityToggle();
            controller.actions.onConfirmPasswordVisibilityToggle();
          }}
          type="button"
          variant="outline"
        >
          {controller.model.passwordVisible
            ? t("hidePassword")
            : t("showPassword")}
        </Button>
        {controller.state.error && (
          <InlineError>{controller.state.error}</InlineError>
        )}
        <Button disabled={controller.state.isLoading} type="submit">
          {controller.state.isLoading ? t("loading") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
