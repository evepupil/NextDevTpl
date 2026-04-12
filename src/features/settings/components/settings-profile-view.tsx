"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { CreditUsageSection } from "@/features/credits/components";
import {
  deleteAccountAction,
  updateProfileAction,
} from "@/features/settings/actions";
import { updateProfileSchema } from "@/features/settings/schemas";
import {
  ALLOWED_IMAGE_TYPES,
  generateAvatarKey,
  getAvatarUrl,
  getSignedUploadUrlAction,
  MAX_FILE_SIZE,
} from "@/features/storage";
import { usePathname, useRouter } from "@/i18n/routing";
import { signOut } from "@/lib/auth/client";

import { BillingSection } from "./billing-section";
import { SecuritySection } from "./security-section";

interface SettingsProfileViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null | undefined;
  };
}

type FormValues = z.infer<typeof updateProfileSchema>;

export function SettingsProfileView({ user }: SettingsProfileViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = useTranslations("Settings");
  const tTabs = useTranslations("Settings.tabs");

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isChangingLocale, startLocaleTransition] = useTransition();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleLanguageChange = (newLocale: string) => {
    startLocaleTransition(() => {
      router.replace(
        // @ts-expect-error Current route params always match the current pathname.
        { pathname, params },
        { locale: newLocale }
      );
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentAvatarUrl = avatarPreview ?? getAvatarUrl(user.image);

  const form = useForm<FormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const { execute: executeUpdateProfile, isPending } = useAction(
    updateProfileAction,
    {
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
          toast.error(errors.join(", ") || t("errors.validationFailed"));
        }
      },
    }
  );

  const { execute: executeDeleteAccount, isPending: isDeletingAccount } =
    useAction(deleteAccountAction, {
      onSuccess: async ({ data }) => {
        setIsDeleteDialogOpen(false);

        if (data?.message) {
          toast.success(data.message);
        }

        try {
          await signOut({
            fetchOptions: {
              onSuccess: () => {
                router.replace("/");
                router.refresh();
              },
            },
          });
        } catch {
          router.replace("/");
          router.refresh();
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || t("deleteAccount.error"));
      },
    });

  const onSubmit = (values: FormValues) => {
    executeUpdateProfile(values);
  };

  const handleAvatarClick = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      toast.error(
        t("errors.unsupportedFileType", {
          types: ALLOWED_IMAGE_TYPES.join(", "),
        })
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        t("errors.fileTooLarge", { size: MAX_FILE_SIZE / 1024 / 1024 })
      );
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const localPreviewUrl = URL.createObjectURL(file);
      setAvatarPreview(localPreviewUrl);

      const key = generateAvatarKey(user.id, file);

      const uploadUrlResult = await getSignedUploadUrlAction({
        key,
        contentType: file.type as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
      });

      if (!uploadUrlResult?.data?.uploadUrl) {
        throw new Error(t("errors.uploadFailed"));
      }

      const uploadResponse = await fetch(uploadUrlResult.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(t("errors.fileUploadFailed"));
      }

      executeUpdateProfile({ image: uploadUrlResult.data.key });
      toast.success(t("success.avatarUpdated"));
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.avatarUploadError")
      );
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAccount = () => {
    executeDeleteAccount();
  };

  return (
    <div className="max-w-4xl space-y-8">
      <Tabs defaultValue="account" className="w-full">
        <div className="border-b border-border pb-2">
          <TabsList className="h-auto gap-1 bg-transparent p-0">
            <TabsTrigger
              value="account"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("account")}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("security")}
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("billing")}
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="rounded-md border border-transparent px-4 py-2 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {tTabs("usage")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account" className="mt-8 space-y-10 pl-4">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t("general.title")}</h2>
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

            <Form {...form}>
              <form
                id="profile-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("general.name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("general.namePlaceholder")}
                          disabled={isPending}
                          className="max-w-md"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("general.nameDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label
                    htmlFor="settings-email"
                    className="text-sm font-medium leading-none"
                  >
                    {t("general.email")}
                  </label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={user.email}
                    disabled
                    className="max-w-md bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("general.emailDescription")}
                  </p>
                </div>
              </form>
            </Form>
          </section>

          <Separator />

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{t("avatar.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("avatar.description")}
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploadingAvatar}
              />

              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="group relative cursor-pointer disabled:cursor-not-allowed"
              >
                <Avatar className="h-24 w-24 transition-opacity group-hover:opacity-80 group-disabled:opacity-60">
                  <AvatarImage src={currentAvatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </div>
              </button>

              <p className="text-sm text-muted-foreground">
                {isUploadingAvatar
                  ? t("avatar.uploading")
                  : t("avatar.supportedFormats", {
                      size: MAX_FILE_SIZE / 1024 / 1024,
                    })}
              </p>
            </div>
          </section>

          <Separator />

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t("language.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("language.description")}
                </p>
              </div>

              <Select
                value={locale}
                onValueChange={handleLanguageChange}
                disabled={isChangingLocale}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("language.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <Separator />

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-destructive">
                  {t("deleteAccount.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("deleteAccount.description")}
                </p>
              </div>

              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                  if (!isDeletingAccount) {
                    setIsDeleteDialogOpen(open);
                  }
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("deleteAccount.button")}
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("deleteAccount.confirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteAccount.confirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingAccount}>
                      {t("deleteAccount.cancel")}
                    </AlertDialogCancel>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("deleteAccount.confirm")}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="security" className="mt-8 pl-4">
          <SecuritySection />
        </TabsContent>

        <TabsContent value="billing" className="mt-8 pl-4">
          <BillingSection />
        </TabsContent>

        <TabsContent value="usage" className="mt-8 pl-4">
          <CreditUsageSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
