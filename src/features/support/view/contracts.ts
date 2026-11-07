import type { FormEventHandler } from "react";

import type { TicketCategory, TicketPriority } from "@/core/support/contracts";

export interface SupportTicketSummary {
  category: string;
  createdAt: string;
  id: string;
  priority: string;
  status: string;
  subject: string;
}

export interface SupportTicketMessageAuthor {
  id: string;
  image: string | null;
  name: string | null;
}

export interface SupportTicketMessage {
  content: string;
  createdAt: string;
  id: string;
  isAdminResponse: boolean;
  user: SupportTicketMessageAuthor | null;
}

export type SupportTicketDetail = SupportTicketSummary;

export interface SupportListViewProps {
  locale: string;
  tickets: readonly SupportTicketSummary[];
}

export type SupportNewViewProps = Record<string, never>;

export interface SupportDetailViewProps {
  currentUserId: string;
  locale: string;
  messages: readonly SupportTicketMessage[];
  ticket: SupportTicketDetail;
}

export interface CreateTicketModel {
  category: TicketCategory;
  categoryOptions: readonly { label: string; value: TicketCategory }[];
  message: string;
  messageCharacterCount: number;
  priority: TicketPriority;
  priorityOptions: readonly { label: string; value: TicketPriority }[];
  subject: string;
}

export interface CreateTicketState {
  isLoading: boolean;
}

export interface CreateTicketActions {
  onSubmit: FormEventHandler<HTMLFormElement>;
  setCategory: (value: string) => void;
  setMessage: (value: string) => void;
  setPriority: (value: string) => void;
  setSubject: (value: string) => void;
}

export interface CreateTicketController {
  actions: CreateTicketActions;
  model: CreateTicketModel;
  state: CreateTicketState;
}

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

export interface ViewContracts {
  "support.list": SupportListViewProps;
  "support.new": SupportNewViewProps;
  "support.detail": SupportDetailViewProps;
}
