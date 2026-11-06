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

export interface ViewContracts {
  "support.list": SupportListViewProps;
  "support.new": SupportNewViewProps;
  "support.detail": SupportDetailViewProps;
}
