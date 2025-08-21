import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roomStatusEnum = pgEnum("room_status", ["available", "occupied", "cleaning", "maintenance"]);
export const roomTypeEnum = pgEnum("room_type", ["standard", "deluxe", "suite"]);
export const purposeEnum = pgEnum("purpose", ["business", "leisure", "conference", "wedding", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "partial", "refunded"]);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["admin", "hotelier"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hotels table for multi-tenancy
export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  gstNumber: varchar("gst_number", { length: 15 }),
  panNumber: varchar("pan_number", { length: 10 }),
  stateCode: varchar("state_code", { length: 2 }), // For GST
  ownerId: varchar("owner_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  number: varchar("number", { length: 10 }).notNull(),
  type: roomTypeEnum("type").notNull(),
  status: roomStatusEnum("status").notNull().default("available"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
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
  documentType: varchar("document_type", { length: 50 }), // Passport, Aadhar, Driver License, etc.
  documentNumber: varchar("document_number", { length: 50 }),
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
  actualCheckOutDate: timestamp("actual_check_out_date"),
  actualCheckOutTime: text("actual_check_out_time"),
  roomRate: decimal("room_rate", { precision: 10, scale: 2 }).notNull(), // Dynamic room rate at time of booking
  cgstRate: decimal("cgst_rate", { precision: 5, scale: 2 }).default("6.00"), // 6% CGST
  sgstRate: decimal("sgst_rate", { precision: 5, scale: 2 }).default("6.00"), // 6% SGST
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoices table for GST compliant billing
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checkInId: varchar("check_in_id").notNull().references(() => checkIns.id),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  guestName: text("guest_name").notNull(),
  guestAddress: text("guest_address").notNull(),
  guestGstNumber: varchar("guest_gst_number", { length: 15 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  cgstRate: decimal("cgst_rate", { precision: 5, scale: 2 }).default("9.00"), // 9% for most states
  sgstRate: decimal("sgst_rate", { precision: 5, scale: 2 }).default("9.00"), // 9% for most states
  igstRate: decimal("igst_rate", { precision: 5, scale: 2 }).default("18.00"), // 18% for interstate
  cgstAmount: decimal("cgst_amount", { precision: 10, scale: 2 }).default("0.00"),
  sgstAmount: decimal("sgst_amount", { precision: 10, scale: 2 }).default("0.00"),
  igstAmount: decimal("igst_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalTax: decimal("total_tax", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  issuedAt: timestamp("issued_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  hotels: many(hotels),
}));

export const hotelsRelations = relations(hotels, ({ many, one }) => ({
  owner: one(users, {
    fields: [hotels.ownerId],
    references: [users.id],
  }),
  rooms: many(rooms),
  invoices: many(invoices),
}));

export const guestsRelations = relations(guests, ({ many }) => ({
  checkIns: many(checkIns),
}));

export const roomsRelations = relations(rooms, ({ many, one }) => ({
  hotel: one(hotels, {
    fields: [rooms.hotelId],
    references: [hotels.id],
  }),
  checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one, many }) => ({
  guest: one(guests, {
    fields: [checkIns.guestId],
    references: [guests.id],
  }),
  room: one(rooms, {
    fields: [checkIns.roomId],
    references: [rooms.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  checkIn: one(checkIns, {
    fields: [invoices.checkInId],
    references: [checkIns.id],
  }),
  hotel: one(hotels, {
    fields: [invoices.hotelId],
    references: [hotels.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
  isActive: true,
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
  actualCheckOutDate: true,
  actualCheckOutTime: true,
}).extend({
  checkInDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  checkOutDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  issuedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
