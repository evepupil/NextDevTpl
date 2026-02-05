"use client";

import { Eye, EyeOff, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/features/shared/icons";
import { Link } from "@/i18n/routing";
import {
  signInWithEmail,
  signInWithGitHub,
  signInWithGoogle,
} from "@/lib/auth/client";

import { AuthErrorAlert } from "./auth-error-alert";
import { AuthLogo } from "./auth-logo";

/**
 * 登录表单组件
 *
 * 功能:
 * - Google OAuth 登录
 * - GitHub OAuth 登录
 * - 邮箱密码登录
 */
export function SignInForm() {
  const t = useTranslations("Auth.signIn");
  const tCommon = useTranslations("Auth.common");
  const tOauth = useTranslations("Auth.oauth");

  // 表单状态
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 处理 Google 登录
   */
  const handleGoogleSignIn = async () => {
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
   * 处理 GitHub 登录
   */
  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGitHub();
    } catch {
      setError(t("errors.github"));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理邮箱密码登录
   */
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t("errors.missingFields"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signInWithEmail(email, password);
    } catch {
      setError(t("errors.invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Logo 和标题 */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <AuthLogo />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* 错误提示 */}
      <AuthErrorAlert message={error} />

      {/* OAuth 登录按钮 */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {tOauth("google")}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGitHubSignIn}
          disabled={isLoading}
        >
          <Github className="mr-2 h-4 w-4" />
          {tOauth("github")}
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
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        {/* 邮箱输入 */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("form.emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("form.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        {/* 密码输入 */}
        <div className="space-y-2">
          <Label htmlFor="password">{t("form.passwordLabel")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
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

        {/* 忘记密码链接 */}
        <div className="text-left">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          >
            {t("form.forgotPassword")}
          </Link>
        </div>

        {/* 提交按钮 */}
        <Button
          type="submit"
          className="w-full bg-indigo-500 hover:bg-indigo-600"
          disabled={isLoading}
        >
          {isLoading ? tCommon("loading") : tCommon("continue")}
        </Button>
      </form>

      {/* 注册链接 */}
      <p className="text-center text-sm text-muted-foreground">
        {t("footer.noAccount")}{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground hover:underline"
        >
          {t("footer.signUp")}
        </Link>
      </p>
    </div>
  );
}
