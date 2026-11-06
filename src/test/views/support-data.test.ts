import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";

import { ticket, ticketMessage } from "@/db/schema/support";
import {
  getSupportDetailViewData,
  getSupportListViewData,
} from "@/features/support/server";
import {
  cleanupTestUsers,
  createTestTicket,
  createTestTicketMessage,
  createTestUser,
  testDb,
} from "../utils";

vi.mock("server-only", () => ({}));

describe("support page data authorization", () => {
  const userIds: string[] = [];

  afterAll(async () => cleanupTestUsers(userIds));

  it("returns an empty list and no details for nonexistent tickets", async () => {
    const user = await createTestUser();
    userIds.push(user.id);

    await expect(getSupportListViewData(user.id, "zh")).resolves.toEqual({
      locale: "zh",
      tickets: [],
    });
    await expect(
      getSupportDetailViewData({
        userId: user.id,
        ticketId: "missing-ticket",
        locale: "zh",
      })
    ).resolves.toBeNull();
  });

  it("lists only the current user's tickets in descending creation order", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    userIds.push(owner.id, other.id);
    const older = await createTestTicket({
      userId: owner.id,
      subject: "Older",
    });
    const newer = await createTestTicket({
      userId: owner.id,
      subject: "Newer",
    });
    await createTestTicket({
      userId: other.id,
      subject: "Private other ticket",
    });
    await testDb
      .update(ticket)
      .set({ createdAt: new Date("2026-01-01T00:00:00Z") })
      .where(eq(ticket.id, older.id));
    await testDb
      .update(ticket)
      .set({ createdAt: new Date("2026-01-02T00:00:00Z") })
      .where(eq(ticket.id, newer.id));

    const data = await getSupportListViewData(owner.id, "en");

    expect(data.locale).toBe("en");
    expect(data.tickets).toEqual([
      {
        id: newer.id,
        subject: "Newer",
        category: "other",
        status: "open",
        priority: "medium",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: older.id,
        subject: "Older",
        category: "other",
        status: "open",
        priority: "medium",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("hides other users' ticket details and returns ordered message summaries to the owner", async () => {
    const owner = await createTestUser({ name: "Ticket Owner" });
    const other = await createTestUser();
    const staff = await createTestUser({
      name: "Support Staff",
      role: "admin",
    });
    userIds.push(owner.id, other.id, staff.id);
    const item = await createTestTicket({
      userId: owner.id,
      subject: "Owner's ticket",
    });
    const reply = await createTestTicketMessage({
      ticketId: item.id,
      userId: staff.id,
      content: "Staff reply",
      isAdminResponse: true,
    });
    const initial = await createTestTicketMessage({
      ticketId: item.id,
      userId: owner.id,
      content: "Initial message",
    });
    await testDb
      .update(ticketMessage)
      .set({ createdAt: new Date("2026-01-01T00:00:00Z") })
      .where(eq(ticketMessage.id, initial.id));
    await testDb
      .update(ticketMessage)
      .set({ createdAt: new Date("2026-01-02T00:00:00Z") })
      .where(eq(ticketMessage.id, reply.id));

    await expect(
      getSupportDetailViewData({
        userId: other.id,
        ticketId: item.id,
        locale: "en",
      })
    ).resolves.toBeNull();
    const data = await getSupportDetailViewData({
      userId: owner.id,
      ticketId: item.id,
      locale: "zh",
    });

    expect(data).toMatchObject({
      currentUserId: owner.id,
      locale: "zh",
      ticket: { id: item.id, subject: "Owner's ticket" },
    });
    expect(data?.messages.map((message) => message.id)).toEqual([
      initial.id,
      reply.id,
    ]);
    expect(data?.messages[1]).toMatchObject({
      content: "Staff reply",
      isAdminResponse: true,
      createdAt: "2026-01-02T00:00:00.000Z",
      user: { id: staff.id, name: "Support Staff" },
    });
    expect(data?.messages[1]?.user).not.toHaveProperty("email");
  });
});
