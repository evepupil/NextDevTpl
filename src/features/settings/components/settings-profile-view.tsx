"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditUsageSection } from "@/credits/components";
import { updateProfileAction } from "@/features/settings/actions";
import { updateProfileSchema } from "@/features/settings/schemas";

/**
 * SettingsProfileView Props 类型
 */
interface SettingsProfileViewProps {
  /** 用户初始数据 */
  user: {
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
  // 文件上传 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 语言选择状态
  const [language, setLanguage] = useState("en");

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
   * 表单实例
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  /**
   * Server Action 绑定
   */
  const { execute, isPending } = useAction(updateProfileAction, {
    onSuccess: ({ data }) => {
      if (data?.message) {
        toast.success(data.message);
      }
    },
    onError: ({ error }) => {
      if (error.serverError) {
        toast.error(error.serverError);
      }
      if (error.validationErrors) {
        const errors = Object.values(error.validationErrors).flat();
        toast.error(errors.join(", ") || "验证失败");
      }
    },
  });

  /**
   * 表单提交
   */
  const onSubmit = (values: FormValues) => {
    execute(values);
  };

  /**
   * 处理头像点击
   */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * 处理文件选择
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: 实现头像上传功能
      toast.info("头像上传功能即将推出");
    }
  };

  /**
   * 处理删除账户
   */
  const handleDeleteAccount = () => {
    // TODO: 实现删除账户功能
    toast.error("此操作不可逆，请谨慎操作");
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Tabs 导航 */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="bg-transparent">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Account Tab 内容 */}
        <TabsContent value="account" className="mt-8 space-y-10">
          {/* General Section */}
          <section className="space-y-6">
            {/* Section Header with Save Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">General</h2>
                <p className="text-sm text-muted-foreground">
                  Update your account settings.
                </p>
              </div>
              <Button
                type="submit"
                form="profile-form"
                size="sm"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
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
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="请输入您的名称"
                          disabled={isPending}
                          className="max-w-md"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Name is required and must be at least 2 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="max-w-md bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    To change your email, please contact support.
                  </p>
                </div>
              </form>
            </Form>
          </section>

          <Separator />

          {/* Avatar Section */}
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Avatar</h2>

            <div className="flex flex-col items-center space-y-4">
              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* 可点击的头像 */}
              <button
                type="button"
                onClick={handleAvatarClick}
                className="group relative cursor-pointer"
              >
                <Avatar className="h-24 w-24 transition-opacity group-hover:opacity-80">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-violet-600 text-white text-2xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Hover 遮罩 */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs text-white font-medium">Change</span>
                </div>
              </button>

              <p className="text-sm text-muted-foreground">
                Supports JPG, PNG up to 5MB
              </p>
            </div>
          </section>

          <Separator />

          {/* Language Settings Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Language Settings</h2>
                <p className="text-sm text-muted-foreground">
                  Select your preferred language.
                </p>
              </div>

              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          {/* Delete Account Section (Danger Zone) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Delete Account</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;d hate to see you go, but you can delete your account
                  here. This action is irreversible.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </div>
          </section>
        </TabsContent>

        {/* Security Tab (空内容) */}
        <TabsContent value="security" className="mt-8">
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">Security settings coming soon...</p>
          </div>
        </TabsContent>

        {/* Billing Tab (空内容) */}
        <TabsContent value="billing" className="mt-8">
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">Billing settings coming soon...</p>
          </div>
        </TabsContent>

        {/* Usage Tab - 积分使用情况 */}
        <TabsContent value="usage" className="mt-8">
          <CreditUsageSection />
        </TabsContent>

        {/* Notifications Tab (空内容) */}
        <TabsContent value="notifications" className="mt-8">
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">Notification settings coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
