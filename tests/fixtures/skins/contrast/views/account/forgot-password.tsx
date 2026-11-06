"use client";

import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { useForgotPasswordController } from "@/features/auth/view";
import { Link } from "@/i18n/routing";

import { FormField, InlineError, TextInput } from "../shared/fields";

export function ForgotPasswordView() {
  const controller = useForgotPasswordController();
  const locale = useLocale();
  const copy =
    locale === "zh"
      ? {
          emailSent: "邮件已发送",
          status: "密码重置链接已发送",
          sentDescription: "密码重置链接已发送，请查看收件箱。",
          backToSignIn: "返回登录",
          title: "忘记密码",
          description: "输入邮箱地址，我们会向你发送密码重置链接。",
          email: "邮箱地址",
          sending: "发送中...",
          submit: "发送重置链接",
        }
      : {
          emailSent: "Email sent",
          status: "Password reset link sent",
          sentDescription:
            "A password reset link has been sent. Check your inbox.",
          backToSignIn: "Back to sign in",
          title: "Forgot password",
          description:
            "Enter your email address and we will send you a reset link.",
          email: "Email address",
          sending: "Sending...",
          submit: "Send reset link",
        };

  if (controller.state.isSuccess) {
    return (
      <section
        aria-live="polite"
        className="max-w-lg border-y border-border py-8"
        data-skin-view="auth.forgot-password"
      >
        <h1 className="font-mono text-xl font-semibold">{copy.emailSent}</h1>
        <p className="mt-3 font-mono text-xs font-semibold uppercase text-success">
          {copy.status}
        </p>
        <p className="mt-3 break-all text-sm">{controller.model.email}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.sentDescription}
        </p>
        <Link
          className="mt-5 inline-block text-primary underline-offset-4 hover:underline"
          href="/sign-in"
        >
          {copy.backToSignIn}
        </Link>
      </section>
    );
  }
  return (
    <div className="max-w-lg" data-skin-view="auth.forgot-password">
      <h1 className="font-mono text-2xl font-semibold">{copy.title}</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        {copy.description}
      </p>
      <form className="grid gap-4" onSubmit={controller.actions.onSubmit}>
        <FormField id="forgot-email" label={copy.email}>
          <TextInput
            autoComplete="email"
            id="forgot-email"
            onChange={(event) =>
              controller.actions.onEmailChange(event.currentTarget.value)
            }
            required
            type="email"
            value={controller.model.email}
          />
        </FormField>
        {controller.state.error && (
          <InlineError>{controller.state.error}</InlineError>
        )}
        <Button disabled={controller.state.isLoading} type="submit">
          {controller.state.isLoading ? copy.sending : copy.submit}
        </Button>
      </form>
      <Link
        className="mt-5 inline-block text-sm text-primary underline-offset-4 hover:underline"
        href="/sign-in"
      >
        {copy.backToSignIn}
      </Link>
    </div>
  );
}
