"use client";

import { KeyRound, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { useForgotPasswordController } from "@/features/auth/view";

import { AuthErrorAlert } from "./components/auth-error-alert";

export function ForgotPasswordView() {
  const { actions, model, state } = useForgotPasswordController();

  if (state.isSuccess) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/15 text-success">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-foreground">{model.email}</span>
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="underline">Back to Login</span>
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below and we&apos;ll send you a link to reset it.
        </p>
      </div>

      <AuthErrorAlert message={state.error} />

      <form onSubmit={actions.onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            value={model.email}
            onChange={(event) => actions.onEmailChange(event.target.value)}
            disabled={state.isLoading}
            autoComplete="email"
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={state.isLoading}>
          {state.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset password link"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </div>
  );
}
