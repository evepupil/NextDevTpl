"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/google-icon";
import { useSignUpController } from "@/features/auth/view";
import { Link } from "@/i18n/routing";

import { FormField, InlineError, TextInput } from "../shared/fields";

export function SignUpView() {
  const controller = useSignUpController();
  const t = useTranslations("Auth.signUp");
  const tPassword = useTranslations("Auth.resetPassword");
  const tCommon = useTranslations("Auth.common");

  if (controller.state.emailSent) {
    return (
      <section
        aria-live="polite"
        className="max-w-lg border-y border-border py-8"
        data-skin-view="auth.sign-up"
      >
        <h1 className="font-mono text-xl font-semibold">
          {t("verifyEmail.title")}
        </h1>
        <p className="mt-3 font-mono text-xs font-semibold uppercase text-success">
          {t("verifyEmail.title")}
        </p>
        <p className="mt-3 break-words text-sm leading-6">
          {t("verifyEmail.description", { email: controller.model.email })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("verifyEmail.hint")}
        </p>
        <Button
          className="mt-5"
          disabled={controller.state.resendCooldown > 0}
          onClick={() => void controller.actions.onResendVerificationEmail()}
          variant="outline"
        >
          {controller.state.resendCooldown > 0
            ? t("verifyEmail.resendCooldown", {
                seconds: controller.state.resendCooldown,
              })
            : t("verifyEmail.resend")}
        </Button>
        <p className="mt-5">
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="/sign-in"
          >
            {t("verifyEmail.backToSignIn")}
          </Link>
        </p>
      </section>
    );
  }

  return (
    <div className="max-w-lg" data-skin-view="auth.sign-up">
      <h1 className="font-mono text-2xl font-semibold">{t("title")}</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <form className="grid gap-4" onSubmit={controller.actions.onSubmit}>
        <FormField id="sign-up-name" label={t("nameLabel")}>
          <TextInput
            autoComplete="name"
            id="sign-up-name"
            onChange={(event) =>
              controller.actions.onNameChange(event.currentTarget.value)
            }
            placeholder={t("namePlaceholder")}
            required
            value={controller.model.name}
          />
        </FormField>
        <FormField id="sign-up-email" label={t("emailLabel")}>
          <TextInput
            autoComplete="email"
            id="sign-up-email"
            onChange={(event) =>
              controller.actions.onEmailChange(event.currentTarget.value)
            }
            placeholder={t("emailPlaceholder")}
            required
            type="email"
            value={controller.model.email}
          />
        </FormField>
        <FormField id="sign-up-password" label={t("passwordLabel")}>
          <TextInput
            autoComplete="new-password"
            id="sign-up-password"
            onChange={(event) =>
              controller.actions.onPasswordChange(event.currentTarget.value)
            }
            placeholder={t("passwordPlaceholder")}
            required
            type={controller.model.passwordVisible ? "text" : "password"}
            value={controller.model.password}
          />
        </FormField>
        <FormField
          id="sign-up-confirm-password"
          label={t("confirmPasswordLabel")}
        >
          <TextInput
            autoComplete="new-password"
            id="sign-up-confirm-password"
            onChange={(event) =>
              controller.actions.onConfirmPasswordChange(
                event.currentTarget.value
              )
            }
            placeholder={t("confirmPasswordPlaceholder")}
            required
            type={controller.model.passwordVisible ? "text" : "password"}
            value={controller.model.confirmPassword}
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
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {tCommon("or")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        className="w-full"
        disabled={controller.state.isLoading}
        onClick={() => void controller.actions.onGoogleSignUp()}
        variant="outline"
      >
        <span aria-hidden="true">
          <GoogleIcon className="size-4" />
        </span>
        {tCommon("google")}
      </Button>
      <p className="mt-6 text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href="/sign-in"
        >
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}
