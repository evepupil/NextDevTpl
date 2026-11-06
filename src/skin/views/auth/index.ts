import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/auth/view";

import { AuthLayout } from "@/skin/layouts/auth";

import { ForgotPasswordView } from "./forgot-password";
import { ResetPasswordView } from "./reset-password";
import { SignInView } from "./sign-in";
import { SignUpView } from "./sign-up";

export const views = {
  "auth.layout": AuthLayout,
  "auth.sign-in": SignInView,
  "auth.sign-up": SignUpView,
  "auth.forgot-password": ForgotPasswordView,
  "auth.reset-password": ResetPasswordView,
} satisfies SkinViews<ViewContracts>;
