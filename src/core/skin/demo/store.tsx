"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { initialDemoData } from "./data.js";
import {
  cancelDemoSubscription,
  changeDemoPlan,
  createDemoTicket,
  replyToDemoTicket,
  resumeDemoSubscription,
  updateDemoProfile,
} from "./model.js";
import type {
  DemoStoreActions,
  DemoStoreContextValue,
  DemoStoreState,
} from "./runtime-contracts.js";
import { validateDemoData } from "./schema.js";
import type { DemoData } from "./types.js";

const DemoStoreContext = createContext<DemoStoreContextValue | null>(null);

function createDemoId(prefix: string): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID !== "function") {
    throw new Error("Secure demo identifier generation is unavailable");
  }
  return `${prefix}-${randomUUID.call(globalThis.crypto)}`;
}

function currentUtcTime(): string {
  return new Date().toISOString();
}

function releaseObjectUrl(value: string | null): void {
  if (
    value?.startsWith("blob:") &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(value);
  }
}

export function DemoStoreProvider({
  children,
  initialData,
}: {
  readonly children: ReactNode;
  readonly initialData?: DemoData;
}) {
  const initialDataRef = useRef<DemoData | null>(null);
  if (initialDataRef.current === null) {
    initialDataRef.current = validateDemoData(initialData ?? initialDemoData);
  }
  const initialDataSnapshot = initialDataRef.current;
  const [state, setState] = useState<DemoStoreState>(() => ({
    data: initialDataSnapshot,
    sessionUserId: initialDataSnapshot.workspace.user.id,
    billingInterval: initialDataSnapshot.workspace.plan.interval,
    avatarPreview: null,
  }));
  const stateRef = useRef(state);

  const commit = useCallback(
    (update: (current: DemoStoreState) => DemoStoreState) => {
      const next = update(stateRef.current);
      stateRef.current = next;
      setState(next);
    },
    []
  );

  const setAvatarPreview = useCallback(
    (url: string | null) => {
      const previous = stateRef.current.avatarPreview;
      if (previous === url) return;
      commit((current) => ({ ...current, avatarPreview: url }));
      releaseObjectUrl(previous);
    },
    [commit]
  );

  useEffect(() => () => releaseObjectUrl(stateRef.current.avatarPreview), []);

  const actions = useMemo<DemoStoreActions>(
    () => ({
      signIn: () => {
        commit((current) => ({
          ...current,
          sessionUserId: initialDataSnapshot.workspace.user.id,
        }));
      },
      signUp: () => {
        commit((current) => ({
          ...current,
          sessionUserId: initialDataSnapshot.workspace.user.id,
        }));
      },
      signOut: () => {
        commit((current) => ({ ...current, sessionUserId: null }));
      },
      deleteAccount: () => {
        setAvatarPreview(null);
        commit((current) => ({
          ...current,
          data: initialDataSnapshot,
          sessionUserId: null,
          billingInterval: initialDataSnapshot.workspace.plan.interval,
          avatarPreview: null,
        }));
      },
      updateProfile: ({ name }) => {
        commit((current) => ({
          ...current,
          data: updateDemoProfile(current.data, name),
        }));
      },
      setAvatarPreview,
      setBillingInterval: (interval) => {
        commit((current) => ({ ...current, billingInterval: interval }));
      },
      changePlan: (planId, interval) => {
        const historyId = createDemoId("billing");
        const at = currentUtcTime();
        commit((current) => ({
          ...current,
          data: changeDemoPlan(current.data, planId, interval, historyId, at),
          billingInterval: interval,
        }));
      },
      cancelSubscription: () => {
        const historyId = createDemoId("billing");
        const at = currentUtcTime();
        commit((current) => ({
          ...current,
          data: cancelDemoSubscription(current.data, historyId, at),
        }));
      },
      resumeSubscription: () => {
        const historyId = createDemoId("billing");
        const at = currentUtcTime();
        commit((current) => ({
          ...current,
          data: resumeDemoSubscription(current.data, historyId, at),
        }));
      },
      createTicket: (input) => {
        const ticketId = createDemoId("ticket");
        const messageId = createDemoId("message");
        const at = currentUtcTime();
        commit((current) => ({
          ...current,
          data: createDemoTicket(current.data, input, ticketId, messageId, at)
            .data,
        }));
        return ticketId;
      },
      replyToTicket: (ticketId, content) => {
        const messageId = createDemoId("message");
        const at = currentUtcTime();
        const current = stateRef.current;
        const data = replyToDemoTicket(
          current.data,
          ticketId,
          content,
          messageId,
          at
        );
        if (!data) return false;
        commit((latest) => ({ ...latest, data }));
        return true;
      },
    }),
    [commit, initialDataSnapshot, setAvatarPreview]
  );

  const value = useMemo<DemoStoreContextValue>(
    () => ({ state, actions }),
    [actions, state]
  );

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore(): DemoStoreContextValue {
  const value = useContext(DemoStoreContext);
  if (!value) {
    throw new Error("DemoStoreProvider is required");
  }
  return value;
}
