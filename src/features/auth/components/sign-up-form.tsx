"use client";

import { Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/features/shared/icons";
import {
  signInWithGoogle,
  signUpWithEmail,
  resendVerificationEmail,
} from "@/lib/auth/client";

import { AuthErrorAlert } from "./auth-error-alert";
import { AuthLogo } from "./auth-logo";

/**
 * 注册表单组件
 *
 * 功能:
 * - Google OAuth 注册
 * - GitHub OAuth 注册
 * - 邮箱密码注册
 */
export function SignUpForm() {
  const t = useTranslations("Auth.signUp");
  const tCommon = useTranslations("Auth.common");

  // 表单状态
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  /**
   * 启动重发冷却倒计时
   */
  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * 重新发送验证邮件
   */
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendVerificationEmail(email);
      startCooldown();
    } catch {
      // 静默失败，不暴露用户是否存在
    }
  };

  /**
   * 处理 Google 注册
   */
  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch {
      setError(t("errors.google"));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理邮箱密码注册
   */
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError(t("errors.missingFields"));
      return;
    }

    if (password.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await signUpWithEmail(email, password, name);

      if (result.error) {
        setError(t("errors.emailInUse"));
        setIsLoading(false);
        return;
      }

      // 注册成功，显示验证邮件提示
      setEmailSent(true);
      startCooldown();
    } catch {
      setError(t("errors.emailInUse"));
      setIsLoading(false);
    }
  };

  // 邮箱验证提示
  if (emailSent) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("verifyEmail.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("verifyEmail.description", { email })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("verifyEmail.hint")}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={resendCooldown > 0}
          >
            {resendCooldown > 0
              ? t("verifyEmail.resendCooldown", { seconds: resendCooldown })
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
      {/* Logo 和标题 */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <AuthLogo />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 错误提示 */}
      <AuthErrorAlert message={error} />

      {/* OAuth 登录按钮 */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {tCommon("google")}
        </Button>
      </div>

      {/* 分隔线 */}
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

      {/* 邮箱密码表单 */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        {/* 姓名输入 */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input
            id="name"
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>

        {/* 邮箱输入 */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        {/* 密码输入 */}
        <div className="space-y-2">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* 确认密码输入 */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder={t("confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        {/* 提交按钮 */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t("loading") : t("submit")}
        </Button>
      </form>

      {/* 登录链接 */}
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
