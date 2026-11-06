"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/google-icon";
import { useSignInController } from "@/features/auth/view";
import { Link } from "@/i18n/routing";

import { FormField, InlineError, TextInput } from "../shared/fields";

export function SignInView() {
  const controller = useSignInController();
  const t = useTranslations("Auth.signIn");
  const tPassword = useTranslations("Auth.resetPassword");
  const tCommon = useTranslations("Auth.common");
  return (
    <div className="max-w-lg" data-skin-view="auth.sign-in">
      <h1 className="font-mono text-2xl font-semibold">{t("title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <form className="grid gap-4" onSubmit={controller.actions.onSubmit}>
        <FormField id="sign-in-email" label={t("emailLabel")}>
          <TextInput
            autoComplete="email"
            id="sign-in-email"
            onChange={(event) =>
              controller.actions.onEmailChange(event.currentTarget.value)
            }
            placeholder={t("emailPlaceholder")}
            required
            type="email"
            value={controller.model.email}
          />
        </FormField>
        <FormField id="sign-in-password" label={t("passwordLabel")}>
          <TextInput
            autoComplete="current-password"
            id="sign-in-password"
            onChange={(event) =>
              controller.actions.onPasswordChange(event.currentTarget.value)
            }
            required
            type={controller.model.passwordVisible ? "text" : "password"}
            value={controller.model.password}
          />
        </FormField>
        <button
          aria-pressed={controller.model.passwordVisible}
          className="justify-self-start text-xs text-primary underline-offset-4 hover:underline"
          onClick={controller.actions.onPasswordVisibilityToggle}
          type="button"
        >
          {controller.model.passwordVisible
            ? tPassword("hidePassword")
            : tPassword("showPassword")}
        </button>
        {controller.state.error && (
          <InlineError>{controller.state.error}</InlineError>
        )}
        <Button disabled={controller.state.isLoading} type="submit">
          {controller.state.isLoading ? t("loading") : t("submit")}
        </Button>
      </form>
      {controller.state.showResend && (
        <Button
          className="mt-3"
          disabled={controller.state.resendCooldown > 0}
          onClick={() => void controller.actions.onResendVerificationEmail()}
          variant="outline"
        >
          {controller.state.resendCooldown > 0
            ? t("resendCooldown", { seconds: controller.state.resendCooldown })
            : t("resendVerification")}
        </Button>
      )}
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {tCommon("or")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        className="w-full"
        disabled={controller.state.isLoading}
        onClick={() => void controller.actions.onGoogleSignIn()}
        variant="outline"
      >
        <span aria-hidden="true">
          <GoogleIcon className="size-4" />
        </span>
        {tCommon("google")}
      </Button>
      <p className="mt-6 text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href="/sign-up"
        >
          {t("signUpLink")}
        </Link>
      </p>
      <Link
        className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
        href="/forgot-password"
      >
        {t("forgotPassword")}
      </Link>
    </div>
  );
}
