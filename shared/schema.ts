import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roomStatusEnum = pgEnum("room_status", ["available", "occupied", "cleaning", "maintenance"]);
export const roomTypeEnum = pgEnum("room_type", ["standard", "deluxe", "suite"]);
export const purposeEnum = pgEnum("purpose", ["business", "leisure", "conference", "wedding", "other"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: varchar("number", { length: 10 }).notNull().unique(),
  type: roomTypeEnum("type").notNull(),
  status: roomStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  comingFrom: text("coming_from").notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  numberOfMales: integer("number_of_males").default(0),
  numberOfFemales: integer("number_of_females").default(0),
  numberOfChildren: integer("number_of_children").default(0),
  purposeOfVisit: purposeEnum("purpose_of_visit"),
  destination: text("destination"),
  signature: text("signature"), // Base64 encoded signature
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestId: varchar("guest_id").notNull().references(() => guests.id),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  checkInDate: timestamp("check_in_date").notNull(),
  checkInTime: text("check_in_time").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  checkOutTime: text("check_out_time").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guestsRelations = relations(guests, ({ many }) => ({
  checkIns: many(checkIns),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  guest: one(guests, {
    fields: [checkIns.guestId],
    references: [guests.id],
  }),
  room: one(rooms, {
    fields: [checkIns.roomId],
    references: [rooms.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
  isActive: true,
}).extend({
  checkInDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  checkOutDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

// Import boolean type
import { boolean } from "drizzle-orm/pg-core";
