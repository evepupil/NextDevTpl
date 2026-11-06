"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import type { FormEventHandler } from "react";
import { toast } from "sonner";

import { addTicketMessageAction } from "@/features/support/actions";

export interface SupportReplyModel {
  content: string;
}

export interface SupportReplyState {
  isLoading: boolean;
}

export interface SupportReplyActions {
  onSubmit: FormEventHandler<HTMLFormElement>;
  setContent: (value: string) => void;
}

export interface SupportReplyController {
  actions: SupportReplyActions;
  model: SupportReplyModel;
  state: SupportReplyState;
}

export function useSupportReplyController(
  ticketId: string
): SupportReplyController {
  const router = useRouter();
  const t = useTranslations("Support");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!content.trim()) {
      toast.error(t("enterMessage"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await addTicketMessageAction({
        ticketId,
        content: content.trim(),
      });

      if (result?.data) {
        toast.success(t("messageSent"));
        setContent("");
        router.refresh();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error(t("sendFailed"));
      console.error(error);
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
