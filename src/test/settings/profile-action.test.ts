import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  revalidatePath: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/lib/safe-action", () => ({
  protectedAction: {
    metadata: () => ({
      schema: (schema: { parse: (input: unknown) => unknown }) => ({
        action:
          (
            handler: (args: { parsedInput: unknown; ctx: unknown }) => unknown
          ) =>
          async (input: unknown) =>
            handler({
              parsedInput: schema.parse(input),
              ctx: { userId: "test-user" },
            }),
      }),
    }),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { updateUser: mocks.updateUser } },
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));

import { updateProfileAction } from "@/features/settings/actions";

describe("updateProfileAction", () => {
  const requestHeaders = new Headers({
    cookie: "better-auth.session_token=test-session",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(requestHeaders);
    mocks.updateUser.mockResolvedValue({
      user: { id: "test-user" },
    });
  });

  it("updates both provided fields through Better Auth with request headers", async () => {
    const result = await updateProfileAction({
      image: "avatars/new.jpg",
      name: "New name",
    });

    expect(mocks.updateUser).toHaveBeenCalledWith({
      body: { image: "avatars/new.jpg", name: "New name" },
      headers: requestHeaders,
    });
    expect(mocks.headers).toHaveBeenCalledOnce();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/settings");
    expect(result).toEqual({ message: "资料更新成功" });
  });

  it("omits the image when only the name is provided", async () => {
    await updateProfileAction({ name: "New name" });

    expect(mocks.updateUser).toHaveBeenCalledWith({
      body: { name: "New name" },
      headers: requestHeaders,
    });
  });

  it("omits the name when only the image is provided", async () => {
    await updateProfileAction({ image: "avatars/new.jpg" });

    expect(mocks.updateUser).toHaveBeenCalledWith({
      body: { image: "avatars/new.jpg" },
      headers: requestHeaders,
    });
  });

  it("keeps empty submissions successful without calling Better Auth", async () => {
    const result = await updateProfileAction({});

    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard/settings");
    expect(result).toEqual({ message: "资料更新成功" });
  });

  it("does not revalidate or return success when Better Auth fails", async () => {
    mocks.updateUser.mockRejectedValueOnce(new Error("update failed"));

    await expect(updateProfileAction({ name: "New name" })).rejects.toThrow(
      "update failed"
    );

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
