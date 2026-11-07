export const TELEMETRY_EVENT_NAMES = [
  "landing.viewed",
  "page.viewed",
  "signup.completed",
  "login.completed",
  "identity.linked",
  "first_value.completed",
  "core_action.completed",
  "api.request.failed",
  "action.failed",
  "job.failed",
  "payment.checkout.started",
  "payment.checkout.completed",
  "credits.purchased",
  "credits.consumed",
  "credits.expired",
  "payment.subscription.created",
  "payment.subscription.canceled",
  "payment.subscription.cancel_requested",
  "payment.subscription.past_due",
  "payment.subscription.paused",
  "payment.subscription.upserted",
  "payment.credits.already_granted",
  "payment.credits.grant_success",
  "subscription.activated",
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

const telemetryEventNames = new Set<string>(TELEMETRY_EVENT_NAMES);

export function isTelemetryEventName(
  value: string
): value is TelemetryEventName {
  return telemetryEventNames.has(value);
}
