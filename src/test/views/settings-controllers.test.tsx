// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPricingPlans } from "@/config/payment";
import { PLAN_PRIVILEGES } from "@/config/subscription-plan";
import { useCreditUsageController } from "@/features/credits/view";
import { PlanInterval } from "@/features/payment/types";
import {
  useSettingsAccountController,
  useSettingsBillingController,
  useSettingsSecurityController,
} from "@/features/settings/view";
import { MAX_FILE_SIZE } from "@/features/storage/types";

interface SignOutOptions {
  fetchOptions: { onSuccess: () => void };
}

interface ActionCallbacks {
  onError?: (result: unknown) => void;
  onSuccess?: (result: unknown) => void | Promise<void>;
}

const mocks = vi.hoisted(() => ({
  actionOptions: new Map<unknown, unknown>(),
  balanceResult: { data: { balance: 0 } },
  batchesResult: { data: [] as unknown[] },
  cancelSubscription: vi.fn(),
  changePassword: vi.fn(),
  createObjectUrl: vi.fn(() => "blob:avatar-preview"),
  deleteAccount: vi.fn(),
  deleteAccountAction: vi.fn(),
  fetch: vi.fn(),
  fetchBalance: vi.fn(),
  fetchBatches: vi.fn(),
  fetchHistory: vi.fn(),
  fetchPlan: vi.fn(),
  fetchTransactions: vi.fn(),
  findPlanByPriceId: vi.fn(),
  getMyActiveBatchesAction: vi.fn(),
  getMyCreditsBalanceAction: vi.fn(),
  getMyPlanAction: vi.fn(),
  getMyTransactionsAction: vi.fn(),
  getSignedUploadUrlAction: vi.fn(),
  getSubscriptionHistoryAction: vi.fn(),
  historyResult: { data: { history: [] as unknown[] } },
  isBalanceLoading: false,
  isDeletingAccount: false,
  isProfileSaving: false,
  isTransactionsLoading: false,
  planResult: { data: {} as Record<string, unknown> },
  resumeSubscription: vi.fn(),
  router: { refresh: vi.fn(), replace: vi.fn() },
  signOut: vi.fn<(options: SignOutOptions) => Promise<void>>(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  transactionsResult: {
    data: { totalCount: 0, transactions: [] as unknown[] },
  },
  updateProfile: vi.fn(),
  updateProfileAction: vi.fn(),
  params: { locale: "en" },
}));

vi.mock("@/features/settings/actions", () => ({
  deleteAccountAction: mocks.deleteAccountAction,
  updateProfileAction: mocks.updateProfileAction,
}));

vi.mock("@/features/storage/actions", () => ({
  getSignedUploadUrlAction: mocks.getSignedUploadUrlAction,
}));

vi.mock("@/features/credits/actions", () => ({
  getMyActiveBatches: mocks.getMyActiveBatchesAction,
  getMyCreditsBalance: mocks.getMyCreditsBalanceAction,
  getMyTransactions: mocks.getMyTransactionsAction,
}));

vi.mock("@/features/subscription/actions", () => ({
  getMyPlanAction: mocks.getMyPlanAction,
}));

vi.mock("@/features/payment/actions", () => ({
  cancelSubscription: mocks.cancelSubscription,
  getSubscriptionHistory: mocks.getSubscriptionHistoryAction,
  resumeSubscription: mocks.resumeSubscription,
}));

vi.mock("@/config/payment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/payment")>();
  return { ...actual, findPlanByPriceId: mocks.findPlanByPriceId };
});

vi.mock("next-safe-action/hooks", () => ({
  useAction: (action: unknown, options?: unknown) => {
    mocks.actionOptions.set(action, options);

    if (action === mocks.updateProfileAction) {
      return { execute: mocks.updateProfile, isPending: mocks.isProfileSaving };
    }
    if (action === mocks.deleteAccountAction) {
      return {
        execute: mocks.deleteAccount,
        isPending: mocks.isDeletingAccount,
      };
    }
    if (action === mocks.getMyCreditsBalanceAction) {
      return {
        execute: mocks.fetchBalance,
        isPending: mocks.isBalanceLoading,
        result: mocks.balanceResult,
      };
    }
    if (action === mocks.getMyActiveBatchesAction) {
      return { execute: mocks.fetchBatches, result: mocks.batchesResult };
    }
    if (action === mocks.getMyTransactionsAction) {
      return {
        execute: mocks.fetchTransactions,
        isPending: mocks.isTransactionsLoading,
        result: mocks.transactionsResult,
      };
    }
    if (action === mocks.getMyPlanAction) {
      return { execute: mocks.fetchPlan, result: mocks.planResult };
    }
    if (action === mocks.getSubscriptionHistoryAction) {
      return { execute: mocks.fetchHistory, result: mocks.historyResult };
    }

    throw new Error("Unexpected action passed to useAction");
  },
}));

vi.mock("@/lib/auth/client", () => ({
  changePassword: mocks.changePassword,
  signOut: mocks.signOut,
}));

vi.mock("@/features/storage/utils", () => ({
  generateAvatarKey: () => "avatar-storage-key",
  getAvatarUrl: (image?: string | null) => image ?? undefined,
}));

vi.mock("@/i18n/routing", () => ({
  usePathname: () => "/dashboard/settings",
  useRouter: () => mocks.router,
}));

vi.mock("next/navigation", () => ({
  useParams: () => mocks.params,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations:
    (namespace: string) => (key: string, values?: Record<string, unknown>) =>
      values
        ? `${namespace}.${key}:${JSON.stringify(values)}`
        : `${namespace}.${key}`,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

const avatarUrlDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  "createObjectURL"
);

const user = {
  email: "person@example.com",
  id: "user-1",
  image: "/avatar.png",
  name: "Before",
};

function getCallbacks(action: unknown): ActionCallbacks {
  return (mocks.actionOptions.get(action) ?? {}) as ActionCallbacks;
}

function avatarChangeEvent(file: File) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = "selected-file";
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file],
  });

  return {
    event: { currentTarget: input } as unknown as ChangeEvent<HTMLInputElement>,
    input,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.actionOptions.clear();
  mocks.balanceResult.data = { balance: 0 };
  mocks.batchesResult.data = [];
  mocks.historyResult.data = { history: [] };
  mocks.planResult.data = {};
  mocks.transactionsResult.data = { totalCount: 0, transactions: [] };
  mocks.isBalanceLoading = false;
  mocks.isDeletingAccount = false;
  mocks.isProfileSaving = false;
  mocks.isTransactionsLoading = false;
  mocks.params = { locale: "en" };
  mocks.createObjectUrl.mockReturnValue("blob:avatar-preview");
  vi.stubGlobal("fetch", mocks.fetch);
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: mocks.createObjectUrl,
  });

  mocks.fetch.mockResolvedValue({ ok: true });
  mocks.getSignedUploadUrlAction.mockResolvedValue({
    data: { key: "avatar-storage-key", uploadUrl: "https://upload.test" },
  });
  mocks.changePassword.mockResolvedValue(undefined);
  mocks.signOut.mockResolvedValue(undefined);
  mocks.cancelSubscription.mockResolvedValue({
    data: { periodEnd: "2030-01-01T00:00:00.000Z", success: true },
  });
  mocks.resumeSubscription.mockResolvedValue({
    data: { periodEnd: "2030-01-01T00:00:00.000Z", success: true },
  });
  mocks.findPlanByPriceId.mockImplementation((priceId: string) => {
    const [planId, period] = priceId.split("-");
    const plan = getPricingPlans().find((item) => item.id === planId) ?? null;
    const interval = period === "year" ? PlanInterval.YEAR : PlanInterval.MONTH;
    const price = plan?.prices?.find((item) => item.interval === interval);

    return {
      plan,
      price: price ? { ...price, priceId } : null,
    };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (avatarUrlDescriptor) {
    Object.defineProperty(URL, "createObjectURL", avatarUrlDescriptor);
  } else {
    Reflect.deleteProperty(URL, "createObjectURL");
  }
});

describe("settings account controller", () => {
  it("submits profile changes and reports action failures", () => {
    const { result } = renderHook(() => useSettingsAccountController(user));

    expect(result.current.model.form.getValues("name")).toBe("Before");
    act(() => {
      result.current.actions.onProfileSubmit({ name: "After" });
    });
    expect(mocks.updateProfile).toHaveBeenCalledWith({ name: "After" });

    act(() => {
      getCallbacks(mocks.updateProfileAction).onError?.({
        error: {
          serverError: "Profile update failed",
          validationErrors: { name: ["Name is invalid"] },
        },
      });
    });
    expect(mocks.toastError).toHaveBeenCalledWith("Profile update failed");
    expect(mocks.toastError).toHaveBeenCalledWith("Name is invalid");
  });

  it("rejects unsupported and oversized avatars before requesting an upload", async () => {
    const { result } = renderHook(() => useSettingsAccountController(user));
    const unsupported = avatarChangeEvent(
      new File(["text"], "note.txt", { type: "text/plain" })
    );
    const oversizedFile = new File(["image"], "large.png", {
      type: "image/png",
    });
    Object.defineProperty(oversizedFile, "size", {
      configurable: true,
      value: MAX_FILE_SIZE + 1,
    });
    const oversized = avatarChangeEvent(oversizedFile);

    await act(async () => {
      await result.current.actions.onAvatarFileChange(unsupported.event);
      await result.current.actions.onAvatarFileChange(oversized.event);
    });

    expect(mocks.getSignedUploadUrlAction).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(
      'Settings.errors.unsupportedFileType:{"types":"image/jpeg, image/png, image/gif, image/webp"}'
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      `Settings.errors.fileTooLarge:{"size":${MAX_FILE_SIZE / 1024 / 1024}}`
    );
    expect(result.current.state.isUploadingAvatar).toBe(false);
  });

  it("clears the avatar preview after a failed upload", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: false });
    const { result } = renderHook(() => useSettingsAccountController(user));
    const event = avatarChangeEvent(
      new File(["image"], "avatar.png", { type: "image/png" })
    );

    await act(async () => {
      await result.current.actions.onAvatarFileChange(event.event);
    });

    expect(mocks.getSignedUploadUrlAction).toHaveBeenCalledWith({
      key: "avatar-storage-key",
      contentType: "image/png",
    });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Settings.errors.fileUploadFailed"
    );
    expect(result.current.model.avatarUrl).toBe("/avatar.png");
    expect(result.current.state.isUploadingAvatar).toBe(false);
    expect(event.input.value).toBe("");
  });

  it("uploads accepted avatars and saves the returned storage key", async () => {
    const { result } = renderHook(() => useSettingsAccountController(user));
    const event = avatarChangeEvent(
      new File(["image"], "avatar.png", { type: "image/png" })
    );

    await act(async () => {
      await result.current.actions.onAvatarFileChange(event.event);
    });

    expect(mocks.fetch).toHaveBeenCalledWith("https://upload.test", {
      body: expect.any(File),
      headers: { "Content-Type": "image/png" },
      method: "PUT",
    });
    expect(mocks.updateProfile).toHaveBeenCalledWith({
      image: "avatar-storage-key",
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Settings.success.avatarUpdated"
    );
    expect(result.current.model.avatarUrl).toBe("blob:avatar-preview");
    expect(result.current.state.isUploadingAvatar).toBe(false);
    expect(event.input.value).toBe("");
  });

  it("switches locale with the active pathname and route parameters", () => {
    const { result } = renderHook(() => useSettingsAccountController(user));

    act(() => result.current.actions.onLanguageChange("zh"));

    expect(mocks.router.replace).toHaveBeenCalledWith(
      { pathname: "/dashboard/settings", params: mocks.params },
      { locale: "zh" }
    );
  });

  it("navigates after successful deletion and leaves failures in place", async () => {
    const { result } = renderHook(() => useSettingsAccountController(user));
    act(() => {
      result.current.actions.setDeleteDialogOpen(true);
      result.current.actions.onDeleteAccount();
    });
    expect(mocks.deleteAccount).toHaveBeenCalledWith({ confirm: true });

    await act(async () => {
      await getCallbacks(mocks.deleteAccountAction).onSuccess?.({
        data: { message: "Account deleted" },
      });
    });
    expect(result.current.state.isDeleteDialogOpen).toBe(false);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Account deleted");
    const signOutOptions = mocks.signOut.mock.calls[0]?.[0];
    act(() => signOutOptions?.fetchOptions.onSuccess());
    expect(mocks.router.replace).toHaveBeenCalledWith("/");
    expect(mocks.router.refresh).toHaveBeenCalledTimes(1);

    act(() => result.current.actions.setDeleteDialogOpen(true));
    act(() => {
      getCallbacks(mocks.deleteAccountAction).onError?.({
        error: { serverError: "Delete failed" },
      });
    });
    expect(result.current.state.isDeleteDialogOpen).toBe(true);
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.router.replace).toHaveBeenCalledTimes(1);
    expect(mocks.toastError).toHaveBeenCalledWith("Delete failed");
  });
});

describe("settings security controller", () => {
  it.each([
    {
      current: "",
      confirm: "new-password",
      error: "missingFields",
      next: "new-password",
    },
    {
      current: "old-password",
      confirm: "short",
      error: "passwordTooShort",
      next: "short",
    },
    {
      current: "old-password",
      confirm: "different-password",
      error: "passwordMismatch",
      next: "new-password",
    },
    {
      current: "same-password",
      confirm: "same-password",
      error: "samePassword",
      next: "same-password",
    },
  ])("rejects invalid password input ($error)", async (testCase) => {
    const { result } = renderHook(() => useSettingsSecurityController());
    act(() => {
      result.current.actions.setCurrentPassword(testCase.current);
      result.current.actions.setNewPassword(testCase.next);
      result.current.actions.setConfirmPassword(testCase.confirm);
    });

    await act(async () => {
      await result.current.actions.onChangePassword();
    });

    expect(mocks.changePassword).not.toHaveBeenCalled();
    expect(result.current.state.error).toBe(
      `Settings.security.errors.${testCase.error}`
    );
  });

  it("clears password fields on success and preserves them with an error on failure", async () => {
    const { result } = renderHook(() => useSettingsSecurityController());
    act(() => {
      result.current.actions.setCurrentPassword("old-password");
      result.current.actions.setNewPassword("new-password");
      result.current.actions.setConfirmPassword("new-password");
    });

    await act(async () => {
      await result.current.actions.onChangePassword();
    });
    expect(mocks.changePassword).toHaveBeenCalledWith(
      "old-password",
      "new-password"
    );
    expect(result.current.model.currentPassword).toBe("");
    expect(result.current.model.newPassword).toBe("");
    expect(result.current.model.confirmPassword).toBe("");
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Settings.security.success"
    );

    mocks.changePassword.mockRejectedValueOnce(new Error("bad credentials"));
    act(() => {
      result.current.actions.setCurrentPassword("wrong-password");
      result.current.actions.setNewPassword("another-password");
      result.current.actions.setConfirmPassword("another-password");
    });
    await act(async () => {
      await result.current.actions.onChangePassword();
    });
    expect(result.current.state.error).toBe(
      "Settings.security.errors.wrongPassword"
    );
    expect(result.current.model.newPassword).toBe("another-password");
    expect(result.current.state.isLoading).toBe(false);
  });
});

describe("credit usage controller", () => {
  it("loads balance, active batches, and the first transaction page on mount", () => {
    renderHook(() => useCreditUsageController());

    expect(mocks.fetchBalance).toHaveBeenCalledTimes(1);
    expect(mocks.fetchBatches).toHaveBeenCalledTimes(1);
    expect(mocks.fetchTransactions).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
    });
  });

  it("selects the earliest expiring batch and maps descriptions and income direction", () => {
    const earliestBatch = {
      expiresAt: "2026-12-01T00:00:00.000Z",
      remaining: 40,
    };
    mocks.balanceResult.data = { balance: 1500 };
    mocks.batchesResult.data = [
      { expiresAt: "2027-01-01T00:00:00.000Z", remaining: 80 },
      { expiresAt: null, remaining: 20 },
      earliestBatch,
    ];
    mocks.transactionsResult.data = {
      totalCount: 3,
      transactions: [
        {
          amount: 3000,
          createdAt: "2026-10-01T00:00:00.000Z",
          description: null,
          id: "grant-1",
          metadata: { interval: "year", planType: "starter" },
          type: "monthly_grant",
        },
        {
          amount: 10,
          createdAt: "2026-10-02T00:00:00.000Z",
          description: null,
          id: "purchase-1",
          metadata: null,
          type: "purchase",
        },
        {
          amount: 5,
          createdAt: "2026-10-03T00:00:00.000Z",
          description: "Generated cards",
          id: "consume-1",
          metadata: null,
          type: "consumption",
        },
      ],
    };
    const { result, rerender } = renderHook(() => useCreditUsageController());

    rerender();

    expect(result.current.model.balance).toBe(1500);
    expect(result.current.model.expiringBatch).toBe(earliestBatch);
    expect(
      result.current.model.transactions.map(
        (transaction) => transaction.isIncome
      )
    ).toEqual([true, true, false]);
    expect(result.current.model.transactions[0]?.displayDescription).toBe(
      'Settings.usage.transactions.descriptions.yearly_grant:{"plan":"Starter","monthly":"3000"}'
    );
    expect(result.current.model.transactions[2]?.displayDescription).toBe(
      "Generated cards"
    );
    expect(result.current.model.transactions[0]).not.toHaveProperty("metadata");
    expect(result.current.model.transactions[0]).not.toHaveProperty(
      "description"
    );
  });

  it("updates offsets when paging and resets the page after a page-size change", async () => {
    const { result } = renderHook(() => useCreditUsageController());

    act(() => result.current.actions.setPage(3));
    await waitFor(() =>
      expect(mocks.fetchTransactions).toHaveBeenLastCalledWith({
        limit: 10,
        offset: 20,
      })
    );
    expect(result.current.state.page).toBe(3);

    act(() => result.current.actions.setPageSize(50));
    await waitFor(() =>
      expect(mocks.fetchTransactions).toHaveBeenLastCalledWith({
        limit: 50,
        offset: 0,
      })
    );
    expect(result.current.state.page).toBe(1);
    expect(result.current.state.pageSize).toBe(50);
  });
});

describe("settings billing controller", () => {
  it("loads a config-backed subscription summary and exposes refresh", () => {
    const proPlan = getPricingPlans().find((plan) => plan.id === "pro");
    const annualPrice = proPlan?.prices?.find(
      (price) => price.interval === PlanInterval.YEAR
    );
    mocks.planResult.data = {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2030-01-01T00:00:00.000Z",
      pendingPriceEffectiveAt: "2027-01-01T00:00:00.000Z",
      pendingPriceId: "starter-month",
      plan: "pro",
      priceId: "pro-year",
    };
    mocks.historyResult.data = {
      history: [
        {
          createdAt: "2026-10-01T00:00:00.000Z",
          effectiveAt: "2026-10-02T00:00:00.000Z",
          eventType: "plan_changed",
          fromPriceId: "starter-month",
          id: "history-1",
          toPriceId: "pro-year",
        },
      ],
    };

    const { result, rerender } = renderHook(() =>
      useSettingsBillingController()
    );
    rerender();

    expect(mocks.fetchPlan).toHaveBeenCalledTimes(1);
    expect(mocks.fetchHistory).toHaveBeenCalledTimes(1);
    expect(result.current.model).toMatchObject({
      currentPeriodEnd: "2030-01-01T00:00:00.000Z",
      currentPlan: "pro",
      currentPlanName: PLAN_PRIVILEGES.pro.name,
      monthlyCredits: PLAN_PRIVILEGES.pro.monthlyCredits,
      pendingPlan: { name: "Starter" },
      pendingPriceEffectiveAt: "2027-01-01T00:00:00.000Z",
      priceDisplay: `$${annualPrice?.amount}`,
      priceInterval: "Settings.billing.currentPlan.perYear",
    });
    expect(result.current.model.history).toEqual([
      {
        createdAt: "2026-10-01T00:00:00.000Z",
        effectiveAt: "2026-10-02T00:00:00.000Z",
        eventType: "plan_changed",
        fromPlanName: "Starter",
        id: "history-1",
        toPlanName: "Pro",
      },
    ]);
    expect(result.current.state.isCancelPending).toBe(true);

    act(() => result.current.actions.refreshBilling());
    expect(mocks.fetchPlan).toHaveBeenCalledTimes(2);
    expect(mocks.fetchHistory).toHaveBeenCalledTimes(2);
  });
});
