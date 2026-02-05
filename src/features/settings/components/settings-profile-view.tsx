"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditUsageSection } from "@/features/credits/components";
import { updateProfileAction } from "@/features/settings/actions";
import { updateProfileSchema } from "@/features/settings/schemas";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  generateAvatarKey,
  getAvatarUrl,
  getSignedUploadUrlAction,
} from "@/features/storage";
import { usePathname, useRouter } from "@/i18n/routing";

/**
 * SettingsProfileView Props 类型
 */
interface SettingsProfileViewProps {
  /** 用户初始数据 */
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null | undefined;
  };
}

/**
 * 表单数据类型
 */
type FormValues = z.infer<typeof updateProfileSchema>;

/**
 * 设置页面主视图组件
 *
 * 包含:
 * - Tabs 导航 (Account, Security, Billing, Usage, Notifications)
 * - General 表单 (Name, Email)
 * - Avatar 上传
 * - Language 设置
 * - Delete Account 危险区域
 */
export function SettingsProfileView({ user }: SettingsProfileViewProps) {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  // 文件上传 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 语言选择状态
  const [language, setLanguage] = useState(locale);

  // 安全设置状态
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);

  // 计费设置状态
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(true);
  const [billingEmail, setBillingEmail] = useState(user.email);

  // 通知设置状态
  const [notificationSettings, setNotificationSettings] = useState({
    product: true,
    usage: true,
    billing: true,
    security: true,
  });

  // 头像上传状态
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // 头像预览 URL (本地预览)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  /**
   * 获取用户名首字母作为头像回退
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * 获取当前显示的头像 URL
   */
  const currentAvatarUrl = avatarPreview ?? getAvatarUrl(user.image);

  /**
   * 表单实例
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  /**
   * Server Action 绑定 - 更新资料
   */
  const { execute: executeUpdateProfile, isPending } = useAction(updateProfileAction, {
    onSuccess: ({ data }) => {
      if (data?.message) {
        toast.success(t("messages.updateSuccess"));
      }
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(t("messages.validationFailed"));
        console.error(error.serverError);
      }
      if (error.validationErrors) {
        toast.error(t("messages.validationFailed"));
      }
    },
  });

  /**
   * 表单提交
   */
  const onSubmit = (values: FormValues) => {
    executeUpdateProfile(values);
  };

  /**
   * 处理头像点击
   */
  const handleAvatarClick = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  /**
   * 处理文件选择并上传头像
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      toast.error(
        t("messages.invalidFileType", {
          types: ALLOWED_IMAGE_TYPES.join(", "),
        })
      );
      return;
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        t("messages.fileTooLarge", {
          size: MAX_FILE_SIZE / 1024 / 1024,
        })
      );
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // 1. 创建本地预览
      const localPreviewUrl = URL.createObjectURL(file);
      setAvatarPreview(localPreviewUrl);

      // 2. 生成唯一文件名
      const key = generateAvatarKey(user.id, file);

      // 3. 获取签名上传 URL
      const uploadUrlResult = await getSignedUploadUrlAction({
        key,
        contentType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      });

      if (!uploadUrlResult?.data?.uploadUrl) {
        throw new Error(t("messages.uploadUrlFailed"));
      }

      // 4. 直接上传文件到存储
      const uploadResponse = await fetch(uploadUrlResult.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(t("messages.uploadFailed"));
      }

      // 5. 更新数据库中的头像字段
      executeUpdateProfile({ image: uploadUrlResult.data.key });
      toast.success(t("avatar.success"));
    } catch (error) {
      console.error("头像上传错误:", error);
      toast.error(
        error instanceof Error ? error.message : t("messages.uploadFailed")
      );
      // 清除预览
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * 处理删除账户
   */
  const handleDeleteAccount = () => {
    // TODO: 实现删除账户功能
    toast.error(t("danger.confirm"));
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    router.replace(pathname, { locale: value as "en" | "zh" });
  };

  const handleSaveSecurity = () => {
    toast.success(t("security.password.saved"));
  };

  const handleSaveBilling = () => {
    toast.success(t("billing.saved"));
  };

  const handleSaveNotifications = () => {
    toast.success(t("notifications.saved"));
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Tabs 导航 */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="bg-transparent">
          <TabsTrigger value="account">{t("tabs.account")}</TabsTrigger>
          <TabsTrigger value="security">{t("tabs.security")}</TabsTrigger>
          <TabsTrigger value="billing">{t("tabs.billing")}</TabsTrigger>
          <TabsTrigger value="usage">{t("tabs.usage")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("tabs.notifications")}</TabsTrigger>
        </TabsList>

        {/* Account Tab 内容 */}
        <TabsContent value="account" className="mt-8 space-y-10">
          {/* General Section */}
          <section className="space-y-6">
            {/* Section Header with Save Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t("general.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("general.description")}
                </p>
              </div>
              <Button
                type="submit"
                form="profile-form"
                size="sm"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("general.save")}
              </Button>
            </div>

            {/* Form */}
            <Form {...form}>
              <form
                id="profile-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.name.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("form.name.placeholder")}
                          disabled={isPending}
                          className="max-w-md"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("form.name.hint")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("form.email.label")}
                  </label>
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="max-w-md bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("form.email.hint")}
                  </p>
                </div>
              </form>
            </Form>
          </section>

          <Separator />

          {/* Avatar Section */}
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">{t("avatar.title")}</h2>

            <div className="flex flex-col items-center space-y-4">
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploadingAvatar}
              />

              {/* 可点击的头像 */}
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="group relative cursor-pointer disabled:cursor-not-allowed"
              >
                <Avatar className="h-24 w-24 transition-opacity group-hover:opacity-80 group-disabled:opacity-60">
                  <AvatarImage src={currentAvatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-violet-600 text-white text-2xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Hover 遮罩 / 上传中状态 */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </button>

              <p className="text-sm text-muted-foreground">
                {isUploadingAvatar
                  ? t("avatar.uploading")
                  : t("avatar.hint", { size: MAX_FILE_SIZE / 1024 / 1024 })}
              </p>
            </div>
          </section>

          <Separator />

          {/* Language Settings Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t("language.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("language.description")}
                </p>
              </div>

              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("language.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("language.options.en")}</SelectItem>
                  <SelectItem value="zh">{t("language.options.zh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Delete Account Section (Danger Zone) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t("danger.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("danger.description")}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteAccount}
              >
                {t("danger.button")}
              </Button>
            </div>
          </section>
        </TabsContent>

        {/* Security Tab (空内容) */}
        <TabsContent value="security" className="mt-8">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {t("security.password.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("security.password.description")}
                  </p>
                </div>
                <Button variant="outline" onClick={handleSaveSecurity}>
                  {t("security.password.action")}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  type="password"
                  placeholder={t("security.password.current")}
                />
                <Input type="password" placeholder={t("security.password.new")} />
                <Input
                  type="password"
                  placeholder={t("security.password.confirm")}
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">
                    {t("security.twoFactor.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("security.twoFactor.description")}
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">
                    {t("security.alerts.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("security.alerts.description")}
                  </p>
                </div>
                <Switch
                  checked={loginAlertsEnabled}
                  onCheckedChange={setLoginAlertsEnabled}
                />
              </div>
            </section>
          </div>
        </TabsContent>

        {/* Billing Tab (空内容) */}
        <TabsContent value="billing" className="mt-8">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {t("billing.plan.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("billing.plan.description")}
                  </p>
                </div>
                <Button variant="outline">
                  {t("billing.plan.manage")}
                </Button>
              </div>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {t("billing.plan.current", { plan: "Pro" })}
                </p>
                <p className="mt-1">
                  {t("billing.plan.nextBill", { date: "2026-03-05" })}
                </p>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">
                  {t("billing.payment.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("billing.payment.description")}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder={t("billing.payment.cardholder")} />
                <Input placeholder={t("billing.payment.cardNumber")} />
                <Input placeholder={t("billing.payment.expiry")} />
                <Input placeholder={t("billing.payment.cvc")} />
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">
                  {t("billing.invoices.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("billing.invoices.description")}
                </p>
              </div>
              <Input
                value={billingEmail}
                onChange={(event) => setBillingEmail(event.target.value)}
                placeholder={t("billing.invoices.placeholder")}
                className="max-w-md"
              />
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">
                    {t("billing.autoRenew.title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("billing.autoRenew.description")}
                  </p>
                </div>
                <Switch
                  checked={autoRenewEnabled}
                  onCheckedChange={setAutoRenewEnabled}
                />
              </div>
              <Button onClick={handleSaveBilling}>{t("billing.save")}</Button>
            </section>
          </div>
        </TabsContent>

        {/* Usage Tab - 积分使用情况 */}
        <TabsContent value="usage" className="mt-8">
          <CreditUsageSection />
        </TabsContent>

        {/* Notifications Tab (空内容) */}
        <TabsContent value="notifications" className="mt-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                {t("notifications.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("notifications.description")}
              </p>
            </div>

            <div className="space-y-4">
              {(
                [
                  { key: "product", title: t("notifications.items.product.title"), description: t("notifications.items.product.description") },
                  { key: "usage", title: t("notifications.items.usage.title"), description: t("notifications.items.usage.description") },
                  { key: "billing", title: t("notifications.items.billing.title"), description: t("notifications.items.billing.description") },
                  { key: "security", title: t("notifications.items.security.title"), description: t("notifications.items.security.description") },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings[item.key]}
                    onCheckedChange={(value) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        [item.key]: value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <Button onClick={handleSaveNotifications}>
              {t("notifications.save")}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
