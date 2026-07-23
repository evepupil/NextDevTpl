import { createModuleRegistry } from "@/core/modules";
import { adminModule } from "@/features/admin/manifest";
import { analyticsModule } from "@/features/analytics/manifest";
import { authModule } from "@/features/auth/manifest";
import { blogModule } from "@/features/blog/manifest";
import { creditsModule } from "@/features/credits/manifest";
import { dashboardModule } from "@/features/dashboard/manifest";
import { mailModule } from "@/features/mail/manifest";
import { marketingModule } from "@/features/marketing/manifest";
import { paymentModule } from "@/features/payment/manifest";
import { pseoModule } from "@/features/pseo/manifest";
import { settingsModule } from "@/features/settings/manifest";
import { sharedModule } from "@/features/shared/manifest";
import { storageModule } from "@/features/storage/manifest";
import { subscriptionModule } from "@/features/subscription/manifest";
import { supportModule } from "@/features/support/manifest";

export const moduleRegistry = createModuleRegistry([
  sharedModule,
  mailModule,
  authModule,
  subscriptionModule,
  paymentModule,
  creditsModule,
  storageModule,
  dashboardModule,
  settingsModule,
  supportModule,
  adminModule,
  analyticsModule,
  blogModule,
  marketingModule,
  pseoModule,
]);
