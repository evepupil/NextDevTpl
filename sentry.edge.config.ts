/**
 * Sentry Edge 配置
 *
 * 用于 Edge Runtime (middleware, edge routes)
 * 仅在 NEXT_PUBLIC_SENTRY_DSN 配置后生效
 */

import { initSentryServer } from "@/lib/monitoring";

initSentryServer();
