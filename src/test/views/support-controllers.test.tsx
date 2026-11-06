// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateTicketController,
  useSupportReplyController,
} from "@/features/support/view";

const mocks = vi.hoisted(() => ({
  addTicketMessageAction: vi.fn(),
  createTicketAction: vi.fn(),
  router: { push: vi.fn(), refresh: vi.fn() },
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/features/support/actions", () => ({
  addTicketMessageAction: mocks.addTicketMessageAction,
  createTicketAction: mocks.createTicketAction,
}));

vi.mock("@/i18n/routing", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

function submitEvent(): FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("create ticket controller", () => {
  it("keeps raw field values and navigates after successful submission", async () => {
    const { result } = renderHook(() => useCreateTicketController());
    expect(result.current.model).toMatchObject({
      category: "other",
      message: "",
      messageCharacterCount: 0,
      priority: "medium",
      subject: "",
    });

    act(() => {
      result.current.actions.setSubject("  billing issue  ");
      result.current.actions.setCategory("billing");
      result.current.actions.setPriority("high");
      result.current.actions.setMessage("  Please help me with this charge.  ");
    });
    expect(result.current.model.messageCharacterCount).toBe(
      "  Please help me with this charge.  ".length
    );

    const request = deferred<{ data: { ticketId: string } }>();
    mocks.createTicketAction.mockImplementationOnce(() => request.promise);
    act(() => {
      void result.current.actions.onSubmit(submitEvent());
    });
    expect(result.current.state.isLoading).toBe(true);
    expect(mocks.createTicketAction).toHaveBeenCalledWith({
      subject: "  billing issue  ",
      category: "billing",
      priority: "high",
      message: "  Please help me with this charge.  ",
    });

    await act(async () => {
      request.resolve({ data: { ticketId: "ticket-1" } });
      await request.promise;
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Support.pages.createSuccess"
    );
    expect(mocks.router.push).toHaveBeenCalledWith(
      "/dashboard/support/ticket-1"
    );
    expect(result.current.state.isLoading).toBe(false);
  });

  it("shows a server error without navigating", async () => {
    mocks.createTicketAction.mockImplementationOnce(async () => ({
      serverError: "Ticket service unavailable",
    }));
    const { result } = renderHook(() => useCreateTicketController());

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastError).toHaveBeenCalledWith("Ticket service unavailable");
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.router.push).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
  });

  it("uses the generic error for thrown failures", async () => {
    mocks.createTicketAction.mockImplementationOnce(async () => {
      throw new Error("network failure");
    });
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useCreateTicketController());

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastError).toHaveBeenCalledWith("Support.pages.createFailed");
    expect(mocks.router.push).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
    logError.mockRestore();
  });

  it("keeps validation errors silent as in the previous page", async () => {
    mocks.createTicketAction.mockImplementationOnce(async () => ({
      validationErrors: { subject: ["Subject is too short"] },
    }));
    const { result } = renderHook(() => useCreateTicketController());

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.router.push).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
  });
});

describe("support reply controller", () => {
  it("rejects empty and whitespace-only replies before calling the action", async () => {
    const { result } = renderHook(() => useSupportReplyController("ticket-1"));
    act(() => result.current.actions.setContent(" \n  \t"));

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.addTicketMessageAction).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith("Support.enterMessage");
    expect(result.current.model.content).toBe(" \n  \t");
    expect(result.current.state.isLoading).toBe(false);
  });

  it("trims replies, waits for completion, clears content, and refreshes", async () => {
    const { result } = renderHook(() => useSupportReplyController("ticket-2"));
    act(() => result.current.actions.setContent("  Need an update.  "));
    const request = deferred<{ data: { message: string } }>();
    mocks.addTicketMessageAction.mockImplementationOnce(() => request.promise);
    act(() => {
      void result.current.actions.onSubmit(submitEvent());
    });

    expect(result.current.state.isLoading).toBe(true);
    expect(mocks.addTicketMessageAction).toHaveBeenCalledWith({
      ticketId: "ticket-2",
      content: "Need an update.",
    });

    await act(async () => {
      request.resolve({ data: { message: "Message sent" } });
      await request.promise;
    });

    expect(mocks.toastSuccess).toHaveBeenCalledWith("Support.messageSent");
    expect(mocks.router.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.model.content).toBe("");
    expect(result.current.state.isLoading).toBe(false);
  });

  it("keeps the reply after a server error", async () => {
    mocks.addTicketMessageAction.mockImplementationOnce(async () => ({
      serverError: "Ticket is closed",
    }));
    const { result } = renderHook(() => useSupportReplyController("ticket-3"));
    act(() => result.current.actions.setContent("A follow-up"));

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastError).toHaveBeenCalledWith("Ticket is closed");
    expect(result.current.model.content).toBe("A follow-up");
    expect(mocks.router.refresh).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
  });

  it("uses the generic error for thrown failures", async () => {
    mocks.addTicketMessageAction.mockImplementationOnce(async () => {
      throw new Error("network failure");
    });
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useSupportReplyController("ticket-4"));
    act(() => result.current.actions.setContent("A follow-up"));

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastError).toHaveBeenCalledWith("Support.sendFailed");
    expect(result.current.model.content).toBe("A follow-up");
    expect(mocks.router.refresh).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
    logError.mockRestore();
  });

  it("keeps validation errors silent as in the previous form", async () => {
    mocks.addTicketMessageAction.mockImplementationOnce(async () => ({
      validationErrors: { content: ["Required"] },
    }));
    const { result } = renderHook(() => useSupportReplyController("ticket-5"));
    act(() => result.current.actions.setContent("Still here"));

    await act(async () => {
      await result.current.actions.onSubmit(submitEvent());
    });

    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(result.current.model.content).toBe("Still here");
    expect(mocks.router.refresh).not.toHaveBeenCalled();
    expect(result.current.state.isLoading).toBe(false);
  });
});
