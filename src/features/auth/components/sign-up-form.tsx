"use client";

import { Eye, EyeOff, Github } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  signInWithGitHub,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth-client";

/**
 * Google 图标组件
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <title>Google</title>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * 注册表单组件
 *
 * 功能:
 * - Google OAuth 注册
 * - GitHub OAuth 注册
 * - 邮箱密码注册
 */
export function SignUpForm() {
  // 表单状态
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 处理 Google 注册
   */
  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch {
      setError("Google 注册失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理 GitHub 注册
   */
  const handleGitHubSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGitHub();
    } catch {
      setError("GitHub 注册失败，请重试");
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
      setError("请填写所有字段");
      return;
    }

    if (password.length < 8) {
      setError("密码至少需要 8 个字符");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signUpWithEmail(email, password, name);
      // 注册成功后会自动跳转
    } catch {
      setError("注册失败，该邮箱可能已被使用");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Logo 和标题 */}
      <div className="flex flex-col items-center space-y-2 text-center">
        {/* Logo 图标 */}
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Logo</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started.
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* OAuth 登录按钮 */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGitHubSignUp}
          disabled={isLoading}
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div>

      {/* 分隔线 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-muted/30 px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* 邮箱密码表单 */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        {/* 姓名输入 */}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>

        {/* 邮箱输入 */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        {/* 密码输入 */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
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

        {/* 提交按钮 */}
        <Button
          type="submit"
          className="w-full bg-indigo-500 hover:bg-indigo-600"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      {/* 登录链接 */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
