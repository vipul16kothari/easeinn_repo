import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum, boolean, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roomStatusEnum = pgEnum("room_status", ["available", "occupied", "cleaning", "maintenance"]);
export const roomTypeEnum = pgEnum("room_type", ["standard", "deluxe", "suite"]);
export const purposeEnum = pgEnum("purpose", ["business", "leisure", "conference", "wedding", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "partial", "refunded"]);

// Channel Manager enums
export const channelStatusEnum = pgEnum("channel_status", ["active", "inactive", "testing", "error"]);
export const syncStatusEnum = pgEnum("sync_status", ["pending", "success", "failed", "partial"]);
export const bookingSourceEnum = pgEnum("booking_source", ["direct", "booking_com", "makemytrip", "agoda", "expedia", "goibibo", "cleartrip", "trivago", "traveloka", "airbnb"]);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["admin", "hotelier"]);

// Platform settings for admin configuration
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment transactions table for tracking hotel onboarding payments
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").references(() => hotels.id),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  razorpaySignature: varchar("razorpay_signature", { length: 500 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, success, failed
  paymentType: varchar("payment_type", { length: 50 }).notNull(), // onboarding_fee, subscription_fee, booking_payment
  planType: varchar("plan_type", { length: 50 }), // hotelier, enterprise
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }),
  monthlyRate: varchar("monthly_rate").default("0.00"),
  // Razorpay integration fields
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 100 }),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 100 }),
  // Google Places API fields
  googlePlaceId: varchar("google_place_id", { length: 255 }),
  googleRating: decimal("google_rating", { precision: 2, scale: 1 }),
  googleReviewCount: integer("google_review_count"),
  website: varchar("website", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  placeTypes: json("place_types").$type<string[]>(),
  photoReferences: json("photo_references").$type<string[]>(),
  // Hotel Configuration Options
  maxRooms: integer("max_rooms").default(50),
  enabledRooms: integer("enabled_rooms").default(10),
  roomTypes: json("room_types").$type<string[]>().default(['standard', 'deluxe', 'suite']),
  features: json("features").$type<string[]>().default(['wifi', 'ac', 'tv', 'parking']),
  policies: json("policies").$type<{
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    petPolicy: boolean;
    smokingPolicy: boolean;
  }>().default({
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: '24 hours',
    petPolicy: false,
    smokingPolicy: false
  }),
  pricing: json("pricing").$type<{
    baseRate: number;
    weekendSurcharge: number;
    seasonalRates: Record<string, number>;
    taxRate: number;
  }>().default({
    baseRate: 2000,
    weekendSurcharge: 500,
    seasonalRates: {},
    taxRate: 18
  }),
  settings: json("settings").$type<{
    allowAdvanceBooking: boolean;
    advanceBookingDays: number;
    requireApproval: boolean;
    autoConfirm: boolean;
    enablePayments: boolean;
    currency: string;
  }>().default({
    allowAdvanceBooking: true,
    advanceBookingDays: 90,
    requireApproval: false,
    autoConfirm: true,
    enablePayments: true,
    currency: 'INR'
  }),
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

// Advance bookings table for future reservations
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  guestName: text("guest_name").notNull(),
  guestPhone: varchar("guest_phone", { length: 20 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }),
  roomType: roomTypeEnum("room_type"), // Optional for multi-room bookings
  numberOfRooms: integer("number_of_rooms").default(1),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  roomRate: decimal("room_rate", { precision: 10, scale: 2 }),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  specialRequests: text("special_requests"),
  roomNumber: varchar("room_number", { length: 10 }),
  bookingStatus: varchar("booking_status", { length: 20 }).notNull().default("confirmed"), // confirmed, cancelled, checked_in
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual room bookings - each booking can have multiple rooms with different types and rates
export const bookingRooms = pgTable("booking_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  roomType: roomTypeEnum("room_type").notNull(),
  roomNumber: varchar("room_number", { length: 10 }), // Optional specific room number
  roomRate: decimal("room_rate", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations for bookings
export const bookingsRelations = relations(bookings, ({ many }) => ({
  rooms: many(bookingRooms),
}));

export const bookingRoomsRelations = relations(bookingRooms, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingRooms.bookingId],
    references: [bookings.id],
  }),
}));

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

// Payments table for Razorpay integration
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  razorpaySignature: varchar("razorpay_signature", { length: 256 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, success, failed
  paymentType: varchar("payment_type", { length: 20 }).notNull(), // subscription, booking, advance
  description: text("description"),
  receiptId: varchar("receipt_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export type UpsertUser = typeof users.$inferInsert;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  checkInDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  checkOutDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  roomRate: z.union([z.string(), z.number().transform((num) => num.toString())]),
  advanceAmount: z.union([z.string(), z.number().transform((num) => num.toString())]).optional(),
  totalAmount: z.union([z.string(), z.number().transform((num) => num.toString())]).optional(),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertBooking = typeof bookings.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type InsertBookingRoom = typeof bookingRooms.$inferInsert;
export type BookingRoom = typeof bookingRooms.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

// Channel Manager Tables

// OTA Channels configuration
export const otaChannels = pgTable("ota_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  channelName: varchar("channel_name", { length: 100 }).notNull(), // booking_com, makemytrip, agoda, etc.
  displayName: varchar("display_name", { length: 100 }).notNull(), // Booking.com, MakeMyTrip, etc.
  status: channelStatusEnum("status").default("inactive"),
  
  // API Configuration
  apiEndpoint: varchar("api_endpoint", { length: 500 }),
  apiCredentials: json("api_credentials").$type<{
    username: string;
    password: string;
    apiKey?: string;
  }>(),
  propertyId: varchar("property_id", { length: 100 }), // Hotel ID on the OTA platform
  
  // Channel Settings
  settings: json("settings").$type<{
    autoSync: boolean;
    rateParity: boolean; // Maintain same rates across channels
    inventoryBuffer: number; // Reserve rooms (e.g., keep 2 rooms unavailable)
    minimumStay: number;
    maximumStay: number;
    advanceBookingDays: number;
    cutoffTime: string; // "18:00" - stop accepting bookings after this time
    commissionRate: number; // OTA commission percentage
  }>().default({
    autoSync: true,
    rateParity: false,
    inventoryBuffer: 0,
    minimumStay: 1,
    maximumStay: 30,
    advanceBookingDays: 365,
    cutoffTime: "18:00",
    commissionRate: 15
  }),
  
  // Connection Details
  lastSyncAt: timestamp("last_sync_at"),
  nextSyncAt: timestamp("next_sync_at"),
  syncFrequency: integer("sync_frequency").default(30), // minutes
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Channel Rate Plans - different pricing strategies per channel
export const channelRatePlans = pgTable("channel_rate_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => otaChannels.id, { onDelete: "cascade" }),
  planName: varchar("plan_name", { length: 100 }).notNull(), // "Standard Rate", "Weekend Special", etc.
  roomType: roomTypeEnum("room_type").notNull(),
  
  // Rate Configuration
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  weekendSurcharge: decimal("weekend_surcharge", { precision: 10, scale: 2 }).default("0.00"),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0.00"), // -10% = discount, +10% = markup
  
  // Seasonal Rates
  seasonalRates: json("seasonal_rates").$type<{
    [dateRange: string]: { // "2024-12-20_2024-12-31"
      rate: number;
      description: string;
    };
  }>().default({}),
  
  // Restrictions
  minimumStay: integer("minimum_stay").default(1),
  maximumStay: integer("maximum_stay").default(30),
  advanceBookingDays: integer("advance_booking_days").default(365),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time inventory and rates per channel per date
export const channelInventory = pgTable("channel_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => otaChannels.id, { onDelete: "cascade" }),
  ratePlanId: varchar("rate_plan_id").notNull().references(() => channelRatePlans.id, { onDelete: "cascade" }),
  roomType: roomTypeEnum("room_type").notNull(),
  date: timestamp("date").notNull(), // Inventory for specific date
  
  // Inventory Details
  totalRooms: integer("total_rooms").notNull(),
  availableRooms: integer("available_rooms").notNull(),
  soldRooms: integer("sold_rooms").default(0),
  
  // Pricing
  sellRate: decimal("sell_rate", { precision: 10, scale: 2 }).notNull(), // Final rate sent to OTA
  
  // Restrictions for this date
  closedToArrival: boolean("closed_to_arrival").default(false),
  closedToDeparture: boolean("closed_to_departure").default(false),
  minimumStay: integer("minimum_stay").default(1),
  maximumStay: integer("maximum_stay").default(30),
  
  // Sync Status
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: syncStatusEnum("sync_status").default("pending"),
  syncErrorMessage: text("sync_error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Channel sync logs for tracking and debugging
export const channelSyncLogs = pgTable("channel_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  channelId: varchar("channel_id").references(() => otaChannels.id),
  
  // Sync Details
  syncType: varchar("sync_type", { length: 50 }).notNull(), // "inventory", "rates", "availability", "booking_import"
  direction: varchar("direction", { length: 20 }).notNull(), // "push", "pull"
  status: syncStatusEnum("status").notNull(),
  
  // Data
  requestPayload: json("request_payload"),
  responseData: json("response_data"),
  errorMessage: text("error_message"),
  
  // Metrics
  recordsProcessed: integer("records_processed").default(0),
  recordsSuccessful: integer("records_successful").default(0),
  recordsFailed: integer("records_failed").default(0),
  
  // Timing
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Channel room mapping - map hotel room types to OTA room types  
export const channelRoomMapping = pgTable("channel_room_mapping", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => otaChannels.id, { onDelete: "cascade" }),
  hotelRoomType: roomTypeEnum("hotel_room_type").notNull(),
  channelRoomTypeId: varchar("channel_room_type_id", { length: 100 }).notNull(), // OTA's room type identifier
  channelRoomTypeName: varchar("channel_room_type_name", { length: 200 }).notNull(), // OTA's room type name
  
  // Room details for OTA
  maxOccupancy: integer("max_occupancy").default(2),
  roomSize: varchar("room_size", { length: 50 }), // "25 sqm"
  bedType: varchar("bed_type", { length: 100 }), // "King bed", "Twin beds"
  amenities: json("amenities").$type<string[]>().default([]), // ["WiFi", "AC", "TV"]
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced bookings table with channel source
export const channelBookings = pgTable("channel_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  channelId: varchar("channel_id").references(() => otaChannels.id),
  
  // Channel booking details
  channelBookingId: varchar("channel_booking_id", { length: 100 }), // OTA's booking reference
  source: bookingSourceEnum("source").notNull(),
  
  // Guest Information
  guestName: text("guest_name").notNull(),
  guestPhone: varchar("guest_phone", { length: 20 }),
  guestEmail: varchar("guest_email", { length: 255 }),
  guestNationality: varchar("guest_nationality", { length: 100 }),
  
  // Booking Details
  roomType: roomTypeEnum("room_type").notNull(),
  numberOfRooms: integer("number_of_rooms").default(1),
  numberOfAdults: integer("number_of_adults").default(1),
  numberOfChildren: integer("number_of_children").default(0),
  
  // Dates and Rates
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  numberOfNights: integer("number_of_nights").notNull(),
  roomRate: decimal("room_rate", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Channel specific details
  channelCommission: decimal("channel_commission", { precision: 10, scale: 2 }).default("0.00"),
  netRate: decimal("net_rate", { precision: 10, scale: 2 }), // Amount after commission
  
  // Booking Management
  bookingStatus: varchar("booking_status", { length: 20 }).default("confirmed"), // confirmed, cancelled, no_show, checked_in, checked_out
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  cancellationPolicy: text("cancellation_policy"),
  specialRequests: text("special_requests"),
  
  // Sync tracking
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: syncStatusEnum("sync_status").default("success"),
  
  // Modifications
  isModified: boolean("is_modified").default(false),
  modificationNotes: text("modification_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for Channel Manager
export const otaChannelsRelations = relations(otaChannels, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [otaChannels.hotelId],
    references: [hotels.id],
  }),
  ratePlans: many(channelRatePlans),
  inventory: many(channelInventory),
  roomMappings: many(channelRoomMapping),
  bookings: many(channelBookings),
}));

export const channelRatePlansRelations = relations(channelRatePlans, ({ one, many }) => ({
  channel: one(otaChannels, {
    fields: [channelRatePlans.channelId],
    references: [otaChannels.id],
  }),
  inventory: many(channelInventory),
}));

export const channelInventoryRelations = relations(channelInventory, ({ one }) => ({
  channel: one(otaChannels, {
    fields: [channelInventory.channelId],
    references: [otaChannels.id],
  }),
  ratePlan: one(channelRatePlans, {
    fields: [channelInventory.ratePlanId],
    references: [channelRatePlans.id],
  }),
}));

export const channelBookingsRelations = relations(channelBookings, ({ one }) => ({
  hotel: one(hotels, {
    fields: [channelBookings.hotelId],
    references: [hotels.id],
  }),
  channel: one(otaChannels, {
    fields: [channelBookings.channelId],
    references: [otaChannels.id],
  }),
}));

// Insert schemas for Channel Manager
export const insertOtaChannelSchema = createInsertSchema(otaChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
  nextSyncAt: true,
});

export const insertChannelRatePlanSchema = createInsertSchema(channelRatePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChannelInventorySchema = createInsertSchema(channelInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChannelBookingSchema = createInsertSchema(channelBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
}).extend({
  checkInDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  checkOutDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export const insertChannelRoomMappingSchema = createInsertSchema(channelRoomMapping).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Extended types for API responses
export type BookingWithRooms = Booking & {
  rooms: BookingRoom[];
};

// Channel Manager Types
export type InsertOtaChannel = z.infer<typeof insertOtaChannelSchema>;
export type OtaChannel = typeof otaChannels.$inferSelect;
export type InsertChannelRatePlan = z.infer<typeof insertChannelRatePlanSchema>;
export type ChannelRatePlan = typeof channelRatePlans.$inferSelect;
export type InsertChannelInventory = z.infer<typeof insertChannelInventorySchema>;
export type ChannelInventory = typeof channelInventory.$inferSelect;
export type InsertChannelBooking = z.infer<typeof insertChannelBookingSchema>;
export type ChannelBooking = typeof channelBookings.$inferSelect;
export type InsertChannelRoomMapping = z.infer<typeof insertChannelRoomMappingSchema>;
export type ChannelRoomMapping = typeof channelRoomMapping.$inferSelect;
export type ChannelSyncLog = typeof channelSyncLogs.$inferSelect;

// Extended types with relations
export type OtaChannelWithRatePlans = OtaChannel & {
  ratePlans: ChannelRatePlan[];
  roomMappings: ChannelRoomMapping[];
};

export type ChannelBookingWithDetails = ChannelBooking & {
  channel: OtaChannel;
};
