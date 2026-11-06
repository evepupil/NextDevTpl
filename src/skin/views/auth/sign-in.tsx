"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/features/shared";
import { Link } from "@/i18n/routing";
import { useSignInController } from "@/features/auth/view";

import { AuthErrorAlert } from "./components/auth-error-alert";
import { AuthLogo } from "./components/auth-logo";

export function SignInView() {
  const t = useTranslations("Auth.signIn");
  const tCommon = useTranslations("Auth.common");
  const { actions, model, state } = useSignInController();

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <AuthLogo />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AuthErrorAlert message={state.error} />

      {state.showResend && (
        <Button
          variant="outline"
          className="w-full"
          onClick={actions.onResendVerificationEmail}
          disabled={state.resendCooldown > 0}
        >
          {state.resendCooldown > 0
            ? t("resendCooldown", { seconds: state.resendCooldown })
            : t("resendVerification")}
        </Button>
      )}

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={actions.onGoogleSignIn}
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
          <span className="bg-background px-2 text-muted-foreground">
            {tCommon("or")}
          </span>
        </div>
      </div>

      <form onSubmit={actions.onSubmit} className="space-y-4">
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
              value={model.password}
              onChange={(event) => actions.onPasswordChange(event.target.value)}
              disabled={state.isLoading}
              autoComplete="current-password"
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

        <div className="text-left">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={state.isLoading}>
          {state.isLoading ? t("loading") : t("submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground hover:underline"
        >
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
