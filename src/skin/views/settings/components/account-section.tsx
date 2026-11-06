"use client";

import { Camera, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

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
import {
  type SettingsPageViewProps,
  useSettingsAccountController,
} from "@/features/settings/view";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AccountSection({ user }: Pick<SettingsPageViewProps, "user">) {
  const t = useTranslations("Settings");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { actions, model, state } = useSettingsAccountController(user);

  return (
    <>
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
            disabled={state.isProfileSaving}
          >
            {state.isProfileSaving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("general.save")}
          </Button>
        </div>

        <Form {...model.form}>
          <form
            id="profile-form"
            onSubmit={model.form.handleSubmit(actions.onProfileSubmit)}
            className="space-y-6"
          >
            <FormField
              control={model.form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("general.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("general.namePlaceholder")}
                      disabled={state.isProfileSaving}
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
            accept={model.supportedImageTypes}
            className="hidden"
            onChange={actions.onAvatarFileChange}
            disabled={state.isUploadingAvatar}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={state.isUploadingAvatar}
            className="group relative cursor-pointer disabled:cursor-not-allowed"
          >
            <Avatar className="h-24 w-24 transition-opacity group-hover:opacity-80 group-disabled:opacity-60">
              <AvatarImage src={model.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100">
              {state.isUploadingAvatar ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </button>

          <p className="text-sm text-muted-foreground">
            {state.isUploadingAvatar
              ? t("avatar.uploading")
              : t("avatar.supportedFormats", {
                  size: model.maxAvatarSizeMegabytes,
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
            value={model.locale}
            onValueChange={actions.onLanguageChange}
            disabled={state.isChangingLocale}
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
            open={state.isDeleteDialogOpen}
            onOpenChange={(open) => {
              if (!state.isDeletingAccount) {
                actions.setDeleteDialogOpen(open);
              }
            }}
          >
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => actions.setDeleteDialogOpen(true)}
              disabled={state.isDeletingAccount}
            >
              {state.isDeletingAccount && (
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
                <AlertDialogCancel disabled={state.isDeletingAccount}>
                  {t("deleteAccount.cancel")}
                </AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={actions.onDeleteAccount}
                  disabled={state.isDeletingAccount}
                >
                  {state.isDeletingAccount && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("deleteAccount.confirm")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </>
  );
}
