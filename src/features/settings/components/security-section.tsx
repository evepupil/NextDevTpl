"use client";

/**
 * 安全设置组件
 *
 * Settings > Security Tab 的主要内容
 * 包含:
 * - 修改密码
 */

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth/client";

/**
 * 安全设置组件
 */
export function SecuritySection() {
  const t = useTranslations("Settings.security");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("errors.missingFields"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    if (currentPassword === newPassword) {
      setError(t("errors.samePassword"));
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword);
      toast.success(t("success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError(t("errors.wrongPassword"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 修改密码 */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("changePassword.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("changePassword.description")}
            </p>
          </div>
          <Button
            size="sm"
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            onClick={handleChangePassword}
          >
            {isLoading ? t("changePassword.updating") : t("changePassword.submit")}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t("changePassword.currentPassword")}</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                placeholder={t("changePassword.currentPasswordPlaceholder")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("changePassword.newPassword")}</Label>
            <Input
              id="new-password"
              type={showPasswords ? "text" : "password"}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("changePassword.confirmPassword")}</Label>
            <Input
              id="confirm-password"
              type={showPasswords ? "text" : "password"}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
