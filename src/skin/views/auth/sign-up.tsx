"use client";

import { Eye, EyeOff, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/google-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSignUpController } from "@/features/auth/view";
import { Link } from "@/i18n/routing";

import { AuthErrorAlert } from "./components/auth-error-alert";
import { AuthLogo } from "./components/auth-logo";

export function SignUpView() {
  const t = useTranslations("Auth.signUp");
  const tCommon = useTranslations("Auth.common");
  const { actions, model, state } = useSignUpController();

  if (state.emailSent) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/15 text-success">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("verifyEmail.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("verifyEmail.description", { email: model.email })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("verifyEmail.hint")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={actions.onResendVerificationEmail}
            disabled={state.resendCooldown > 0}
          >
            {state.resendCooldown > 0
              ? t("verifyEmail.resendCooldown", {
                  seconds: state.resendCooldown,
                })
              : t("verifyEmail.resend")}
          </Button>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {t("verifyEmail.backToSignIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <AuthLogo />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AuthErrorAlert message={state.error} />

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={actions.onGoogleSignUp}
          disabled={state.isLoading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {tCommon("google")}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-muted/30 px-2 text-muted-foreground">
            {tCommon("or")}
          </span>
        </div>
      </div>

      <form onSubmit={actions.onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input
            id="name"
            type="text"
            placeholder={t("namePlaceholder")}
            value={model.name}
            onChange={(event) => actions.onNameChange(event.target.value)}
            disabled={state.isLoading}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={model.email}
            onChange={(event) => actions.onEmailChange(event.target.value)}
            disabled={state.isLoading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={model.passwordVisible ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              value={model.password}
              onChange={(event) => actions.onPasswordChange(event.target.value)}
              disabled={state.isLoading}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={actions.onPasswordVisibilityToggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {model.passwordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
          <Input
            id="confirmPassword"
            type={model.passwordVisible ? "text" : "password"}
            placeholder={t("confirmPasswordPlaceholder")}
            value={model.confirmPassword}
            onChange={(event) =>
              actions.onConfirmPasswordChange(event.target.value)
            }
            disabled={state.isLoading}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={state.isLoading}>
          {state.isLoading ? t("loading") : t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground hover:underline"
        >
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}
