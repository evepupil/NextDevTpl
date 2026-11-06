// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BillingSection } from "@/skin/views/settings/components/billing-section";

const mocks = vi.hoisted(() => ({
  cancelSubscription: vi.fn(),
  fetchHistory: vi.fn(),
  fetchPlan: vi.fn(),
  getMyPlanAction: vi.fn(),
  getSubscriptionHistory: vi.fn(),
  historyResult: { data: { history: [] as unknown[] } },
  planResult: { data: {} as Record<string, unknown> },
  resumeSubscription: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/features/payment/actions", () => ({
  cancelSubscription: mocks.cancelSubscription,
  getSubscriptionHistory: mocks.getSubscriptionHistory,
  resumeSubscription: mocks.resumeSubscription,
}));

vi.mock("@/features/subscription/actions", () => ({
  getMyPlanAction: mocks.getMyPlanAction,
}));

vi.mock("next-safe-action/hooks", () => ({
  useAction: (action: unknown) =>
    action === mocks.getMyPlanAction
      ? { execute: mocks.fetchPlan, result: mocks.planResult }
      : { execute: mocks.fetchHistory, result: mocks.historyResult },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

const REQUEST_IDS = [
  "10000000-0000-4000-8000-000000000001",
  "20000000-0000-4000-8000-000000000002",
] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANCEL_BUTTON = "currentPlan.cancelSubscription";
const CONFIRM_BUTTON = "currentPlan.cancelDialog.confirm";
const CANCEL_SUCCESS = "currentPlan.cancelSuccess";
const ACTION_FAILED = "currentPlan.actionFailed";

function renderBillingSection(cancelAtPeriodEnd = false) {
  mocks.planResult.data = {
    cancelAtPeriodEnd,
    currentPeriodEnd: "2030-01-01T00:00:00.000Z",
    plan: "pro",
  };
  mocks.historyResult.data = { history: [] };

  return render(<BillingSection />);
}

async function openCancelDialog() {
  fireEvent.click(screen.getByRole("button", { name: CANCEL_BUTTON }));
  return screen.findByRole("alertdialog");
}

async function waitForActionToast() {
  await waitFor(() => {
    expect(
      mocks.toastError.mock.calls.length + mocks.toastSuccess.mock.calls.length
    ).toBeGreaterThan(0);
  });
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.cancelSubscription.mockResolvedValue({
    data: { periodEnd: "2030-01-01T00:00:00.000Z", success: true },
  });
  mocks.resumeSubscription.mockResolvedValue({
    data: { periodEnd: "2030-01-01T00:00:00.000Z", success: true },
  });

  let requestIdIndex = 0;
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(
      () => REQUEST_IDS[requestIdIndex++] ?? REQUEST_IDS.at(-1)
    ),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BillingSection subscription actions", () => {
  it("C1 reports cancel server errors and keeps the confirmation dialog open", async () => {
    mocks.cancelSubscription.mockResolvedValueOnce({
      serverError: "服务器错误，请稍后重试",
    });
    renderBillingSection();

    const dialog = await openCancelDialog();
    fireEvent.click(
      within(dialog).getByRole("button", { name: CONFIRM_BUTTON })
    );
    await waitForActionToast();

    expect.soft(mocks.toastError).toHaveBeenCalledWith(ACTION_FAILED);
    expect.soft(mocks.toastSuccess).not.toHaveBeenCalled();
    expect.soft(screen.queryByRole("alertdialog")).not.toBeNull();
  });

  it("C2 reuses the request ID when retrying a failed cancellation", async () => {
    mocks.cancelSubscription
      .mockResolvedValueOnce({ serverError: "服务器错误" })
      .mockResolvedValueOnce({
        data: { periodEnd: "2030-01-01T00:00:00.000Z", success: true },
      });
    renderBillingSection();

    const firstDialog = await openCancelDialog();
    fireEvent.click(
      within(firstDialog).getByRole("button", { name: CONFIRM_BUTTON })
    );
    await waitForActionToast();

    const dialogAfterFailure = screen.queryByRole("alertdialog");
    expect.soft(dialogAfterFailure).not.toBeNull();

    if (!dialogAfterFailure) {
      fireEvent.click(screen.getByRole("button", { name: CANCEL_BUTTON }));
      await screen.findByRole("alertdialog");
    }

    const dialogForRetry = screen.getByRole("alertdialog");
    const retryButton = within(dialogForRetry).getByRole("button", {
      name: CONFIRM_BUTTON,
    });
    await waitFor(() => expect(retryButton).toBeEnabled());

    const successCallsBeforeRetry = mocks.toastSuccess.mock.calls.length;
    fireEvent.click(retryButton);
    await waitFor(() =>
      expect(mocks.cancelSubscription).toHaveBeenCalledTimes(2)
    );
    await waitFor(() =>
      expect(mocks.toastSuccess.mock.calls.length).toBeGreaterThan(
        successCallsBeforeRetry
      )
    );

    const firstRequestId =
      mocks.cancelSubscription.mock.calls[0]?.[0]?.requestId;
    const secondRequestId =
      mocks.cancelSubscription.mock.calls[1]?.[0]?.requestId;
    expect.soft(firstRequestId).toMatch(UUID_PATTERN);
    expect.soft(secondRequestId).toBe(firstRequestId);
    expect.soft(mocks.toastSuccess).toHaveBeenCalledWith(CANCEL_SUCCESS);
    expect.soft(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("C3 generates a new request ID after a successful cancellation", async () => {
    renderBillingSection();

    const firstDialog = await openCancelDialog();
    fireEvent.click(
      within(firstDialog).getByRole("button", { name: CONFIRM_BUTTON })
    );
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(CANCEL_SUCCESS)
    );

    const secondDialog = await openCancelDialog();
    const secondConfirmButton = within(secondDialog).getByRole("button", {
      name: CONFIRM_BUTTON,
    });
    await waitFor(() => expect(secondConfirmButton).toBeEnabled());
    fireEvent.click(secondConfirmButton);
    await waitFor(() =>
      expect(mocks.cancelSubscription).toHaveBeenCalledTimes(2)
    );
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledTimes(2));

    const firstRequestId =
      mocks.cancelSubscription.mock.calls[0]?.[0]?.requestId;
    const secondRequestId =
      mocks.cancelSubscription.mock.calls[1]?.[0]?.requestId;
    expect(firstRequestId).toMatch(UUID_PATTERN);
    expect(secondRequestId).toMatch(UUID_PATTERN);
    expect(secondRequestId).not.toBe(firstRequestId);
  });

  it("C4 reports cancellation validation errors without a success toast", async () => {
    mocks.cancelSubscription.mockResolvedValueOnce({
      validationErrors: { requestId: ["x"] },
    });
    renderBillingSection();

    const dialog = await openCancelDialog();
    fireEvent.click(
      within(dialog).getByRole("button", { name: CONFIRM_BUTTON })
    );
    await waitForActionToast();

    expect.soft(mocks.toastError).toHaveBeenCalledWith(ACTION_FAILED);
    expect.soft(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("C5 reports resume server errors without a success toast", async () => {
    mocks.resumeSubscription.mockResolvedValueOnce({ serverError: "x" });
    renderBillingSection(true);

    fireEvent.click(
      screen.getByRole("button", { name: "currentPlan.resumeSubscription" })
    );
    await waitForActionToast();

    expect.soft(mocks.toastError).toHaveBeenCalledWith(ACTION_FAILED);
    expect.soft(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it("C6 reports successful subscription resumption", async () => {
    renderBillingSection(true);

    fireEvent.click(
      screen.getByRole("button", { name: "currentPlan.resumeSubscription" })
    );
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "currentPlan.resumeSuccess"
      )
    );

    expect(mocks.toastError).not.toHaveBeenCalled();
  });
});
