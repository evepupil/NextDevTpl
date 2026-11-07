"use client";

import { useTranslations } from "next-intl";
import type { FormEventHandler } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { createTicketAction } from "@/features/support/actions";
import {
  type CreateTicketInput,
  ticketCategories,
  ticketPriorities,
} from "@/features/support/schemas";
import { useRouter } from "@/i18n/routing";

import type { CreateTicketController } from "./contracts";

export type {
  CreateTicketActions,
  CreateTicketController,
  CreateTicketModel,
  CreateTicketState,
} from "./contracts";

export function useCreateTicketController(): CreateTicketController {
  const router = useRouter();
  const t = useTranslations("Support");
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] =
    useState<CreateTicketInput["category"]>("other");
  const [priority, setPriority] =
    useState<CreateTicketInput["priority"]>("medium");
  const [message, setMessage] = useState("");

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await createTicketAction({
        subject,
        category,
        priority,
        message,
      });

      if (result?.data) {
        toast.success(t("pages.createSuccess"));
        router.push(`/dashboard/support/${result.data.ticketId}`);
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error(t("pages.createFailed"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    actions: {
      onSubmit,
      setCategory: (value) =>
        setCategory(value as CreateTicketInput["category"]),
      setMessage,
      setPriority: (value) =>
        setPriority(value as CreateTicketInput["priority"]),
      setSubject,
    },
    model: {
      category,
      categoryOptions: ticketCategories.map(({ label, value }) => ({
        label,
        value,
      })),
      message,
      messageCharacterCount: message.length,
      priority,
      priorityOptions: ticketPriorities.map(({ label, value }) => ({
        label,
        value,
      })),
      subject,
    },
    state: { isLoading },
  };
}
