import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const newsletterSubscriber = pgTable("newsletter_subscriber", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  isSubscribed: boolean("is_subscribed").notNull().default(true),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type NewsletterSubscriber = typeof newsletterSubscriber.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscriber.$inferInsert;
