// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsAccountController } from "@/features/settings/view";

interface DeleteActionCallbacks {
  onSuccess?: (result: unknown) => void | Promise<void>;
}

const mocks = vi.hoisted(() => ({
  actionOptions: new Map<unknown, unknown>(),
  deleteAccountAction: vi.fn(),
  executeDeleteAccount: vi.fn(),
  executeUpdateProfile: vi.fn(),
  navigateAfterSignOut: vi.fn(),
  router: { refresh: vi.fn(), replace: vi.fn() },
  signOut: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  updateProfileAction: vi.fn(),
}));

vi.mock("@/features/settings/actions", () => ({
  deleteAccountAction: mocks.deleteAccountAction,
  updateProfileAction: mocks.updateProfileAction,
}));

vi.mock("@/features/storage/actions", () => ({
  getSignedUploadUrlAction: vi.fn(),
}));

vi.mock("@/features/storage/types", () => ({
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png"],
  MAX_FILE_SIZE: 5_000_000,
}));

vi.mock("@/features/storage/utils", () => ({
  generateAvatarKey: () => "avatar-key",
  getAvatarUrl: (image?: string | null) => image ?? undefined,
}));

vi.mock("@/i18n/routing", () => ({
  usePathname: () => "/dashboard/settings",
  useRouter: () => mocks.router,
}));

vi.mock("@/lib/auth/client", () => ({ signOut: mocks.signOut }));
vi.mock("@/lib/auth/navigation", () => ({
  navigateAfterSignOut: mocks.navigateAfterSignOut,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "en" }) }));

vi.mock("next-safe-action/hooks", () => ({
  useAction: (action: unknown, options: unknown) => {
    mocks.actionOptions.set(action, options);
    if (action === mocks.deleteAccountAction) {
      return { execute: mocks.executeDeleteAccount, isPending: false };
    }
    if (action === mocks.updateProfileAction) {
      return { execute: mocks.executeUpdateProfile, isPending: false };
    }
    throw new Error("Unexpected action passed to useAction");
  },
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

const user = {
  email: "person@example.com",
  id: "user-1",
  image: null,
  name: "Person",
};

function getDeleteCallbacks(): DeleteActionCallbacks {
  return (mocks.actionOptions.get(mocks.deleteAccountAction) ??
    {}) as DeleteActionCallbacks;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.actionOptions.clear();
  mocks.signOut.mockImplementation(
    async (options: { fetchOptions: { onSuccess: () => void } }) =>
      options.fetchOptions.onSuccess()
  );
});

describe("account deletion with no marketing route", () => {
  it("signs out to the auth page after deletion", async () => {
    const { result } = renderHook(() => useSettingsAccountController(user));

    act(() => result.current.actions.onDeleteAccount());
    expect(mocks.executeDeleteAccount).toHaveBeenCalledWith({ confirm: true });

    await act(async () => {
      await getDeleteCallbacks().onSuccess?.({ data: { message: "Deleted" } });
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith("Deleted");
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.navigateAfterSignOut).toHaveBeenCalledWith("en");
    expect(mocks.router.replace).not.toHaveBeenCalled();
    expect(mocks.router.refresh).not.toHaveBeenCalled();
  });
});
