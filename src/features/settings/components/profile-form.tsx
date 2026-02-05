"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  updateProfileAction,
} from "@/features/settings/actions";
import { updateProfileSchema } from "@/features/settings/schemas";

/**
 * ProfileForm Props 类型
 */
interface ProfileFormProps {
  /** 初始数据，用于填充表单默认值 */
  initialData: {
    name: string;
  };
}

/**
 * 表单数据类型，从 Zod Schema 推断
 */
type FormValues = z.infer<typeof updateProfileSchema>;

/**
 * 个人资料表单组件
 *
 * 功能:
 * - 显示用户当前名称
 * - 允许用户修改名称
 * - 表单验证 (使用 Zod)
 * - 提交时调用 Server Action 更新数据库
 * - 显示成功/错误 Toast 通知
 */
export function ProfileForm({ initialData }: ProfileFormProps) {
  const t = useTranslations("Settings.profileForm");
  const tMessages = useTranslations("Settings.messages");
  /**
   * 使用 react-hook-form 创建表单实例
   * - zodResolver: 使用 Zod schema 进行验证
   * - defaultValues: 初始值来自服务端传入的数据
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialData.name,
    },
  });

  /**
   * 使用 next-safe-action 的 useAction Hook
   * 绑定 updateProfileAction Server Action
   */
  const { execute, isPending } = useAction(updateProfileAction, {
    /**
     * 操作成功回调
     */
    onSuccess: ({ data }) => {
      if (data?.message) {
        toast.success(tMessages("updateSuccess"));
      }
    },
    /**
     * 操作失败回调
     */
    onError: ({ error }) => {
      // 显示服务器返回的错误信息
      if (error.serverError) {
        toast.error(tMessages("validationFailed"));
        console.error(error.serverError);
      }
      // 显示验证错误信息
      if (error.validationErrors) {
        toast.error(tMessages("validationFailed"));
      }
    },
  });

  /**
   * 表单提交处理函数
   */
  const onSubmit = (values: FormValues) => {
    execute(values);
  };

  return (
    <Card className="max-w-2xl">
      {/* 卡片头部 */}
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>

      {/* 表单内容 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* 显示名称输入字段 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.name.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("fields.name.placeholder")}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.name.hint")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          {/* 卡片底部 - 提交按钮 */}
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
