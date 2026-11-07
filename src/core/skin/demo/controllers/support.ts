"use client";

import { useTranslations } from "next-intl";
import type { FormEventHandler } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type TicketCategory,
  type TicketPriority,
} from "@/core/support/contracts.js";
import type {
  CreateTicketController,
  SupportReplyController,
} from "@/features/support/view";
import {
  addTicketMessageSchema,
  createTicketSchema,
} from "@/features/support/view";
import { useRouter } from "@/i18n/routing";

import { useDemoStore } from "../store.js";

export function useCreateTicketController(): CreateTicketController {
  const router = useRouter();
  const t = useTranslations("Support");
  const { actions: demoActions } = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState("");
  const categoryOptions = TICKET_CATEGORIES.map((value) => ({
    label: `categories.${value}`,
    value,
  }));
  const priorityOptions = TICKET_PRIORITIES.map((value) => ({
    label: `priorities.${value}`,
    value,
  }));

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const input = {
      subject: subject.trim(),
      category,
      priority,
      message: message.trim(),
    };
    const parsed = createTicketSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(t("pages.createFailed"));
      return;
    }

    setIsLoading(true);
    try {
      const ticketId = demoActions.createTicket(parsed.data);
      toast.success(t("pages.createSuccess"));
      router.push(`/dashboard/support/${ticketId}`);
    } catch {
      toast.error(t("pages.createFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    actions: {
      onSubmit,
      setCategory: (value) => {
        const nextCategory = TICKET_CATEGORIES.find((item) => item === value);
        if (nextCategory) setCategory(nextCategory);
      },
      setMessage,
      setPriority: (value) => {
        const nextPriority = TICKET_PRIORITIES.find((item) => item === value);
        if (nextPriority) setPriority(nextPriority);
      },
      setSubject,
    },
    model: {
      category,
      categoryOptions,
      message,
      messageCharacterCount: message.length,
      priority,
      priorityOptions,
      subject,
    },
    state: { isLoading },
  };
}

export function useSupportReplyController(
  ticketId: string
): SupportReplyController {
  const t = useTranslations("Support");
  const { actions: demoActions } = useDemoStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const nextContent = content.trim();
    if (!nextContent) {
      toast.error(t("enterMessage"));
      return;
    }
    const parsed = addTicketMessageSchema.safeParse({
      ticketId,
      content: nextContent,
    });
    if (!parsed.success) {
      toast.error(t("sendFailed"));
      return;
    }

    setIsLoading(true);
    try {
      if (
        !demoActions.replyToTicket(parsed.data.ticketId, parsed.data.content)
      ) {
        toast.error(t("sendFailed"));
        return;
      }
      toast.success(t("messageSent"));
      setContent("");
    } catch {
      toast.error(t("sendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    actions: { onSubmit, setContent },
    model: { content },
    state: { isLoading },
  };
}
