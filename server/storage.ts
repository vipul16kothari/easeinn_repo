import { 
  users, rooms, guests, checkIns, hotels, invoices, bookings, bookingRooms,
  otaChannels, channelRatePlans, channelInventory, channelSyncLogs, channelRoomMapping, channelBookings,
  hotelLeads, auditLogs, selfCheckInRequests,
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Guest, type InsertGuest,
  type CheckIn, type InsertCheckIn,
  type Hotel, type InsertHotel,
  type Invoice, type InsertInvoice,
  type Booking, type InsertBooking,
  type BookingRoom, type InsertBookingRoom,
  type BookingWithRooms,
  type OtaChannel, type InsertOtaChannel,
  type ChannelRatePlan, type InsertChannelRatePlan,
  type ChannelInventory, type InsertChannelInventory,
  type ChannelBooking, type InsertChannelBooking,
  type ChannelRoomMapping, type InsertChannelRoomMapping,
  type ChannelSyncLog,
  type OtaChannelWithRatePlans,
  type HotelLead, type InsertHotelLead,
  type AuditLog, type InsertAuditLog,
  type SelfCheckInRequest, type InsertSelfCheckInRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Hotel methods
  getHotel(id: string): Promise<Hotel | undefined>;
  getHotels(): Promise<Hotel[]>;
  getHotelsByOwnerId(ownerId: string): Promise<Hotel[]>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, updates: Partial<Hotel>): Promise<Hotel>;
  toggleHotelActive(hotelId: string): Promise<Hotel>;
  getHotelByOwnerId(ownerId: string): Promise<Hotel | undefined>;
  
  // Room methods
  getRooms(hotelId?: string): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByNumber(number: string, hotelId?: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  updateRoomStatus(id: string, status: "available" | "occupied" | "cleaning" | "maintenance"): Promise<Room | undefined>;
  getAvailableRooms(hotelId?: string): Promise<Room[]>;
  
  // Guest methods
  getGuests(search?: string, limit?: number, offset?: number): Promise<{ guests: (Guest & { room?: Room; checkInDate?: Date })[], total: number }>;
  getGuest(id: string): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  
  // Check-in methods
  getCheckIns(): Promise<(CheckIn & { guest: Guest; room: Room })[]>;
  getActiveCheckIns(): Promise<(CheckIn & { guest: Guest; room: Room })[]>;
  getCheckInWithDetails(checkInId: string): Promise<(CheckIn & { guest: Guest; room: Room & { hotel?: Hotel } }) | undefined>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  updateCheckOut(checkInId: string, checkOutData: { actualCheckOutDate: Date; actualCheckOutTime: string; totalAmount: number; paymentStatus: string }): Promise<void>;
  checkOutGuest(guestId: string): Promise<void>;
  
  // Booking methods
  getBookings(hotelId?: string): Promise<BookingWithRooms[]>;
  getBooking(id: string): Promise<BookingWithRooms | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  createBookingWithRooms(booking: InsertBooking, rooms: InsertBookingRoom[]): Promise<BookingWithRooms>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  getBookingsByDateRange(startDate: Date, endDate: Date, hotelId?: string): Promise<Booking[]>;
  
  // Invoice methods
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByHotel(hotelId: string): Promise<Invoice[]>;
  
  // Statistics
  getRoomStatistics(): Promise<{
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
  }>;

  // Channel Manager methods
  getOtaChannel(id: string): Promise<OtaChannel | undefined>;
  getChannelsByHotelId(hotelId: string): Promise<OtaChannel[]>;
  getActiveChannelsByHotelId(hotelId: string): Promise<OtaChannel[]>;
  createOtaChannel(channel: InsertOtaChannel): Promise<OtaChannel>;
  updateOtaChannel(id: string, updates: Partial<OtaChannel>): Promise<OtaChannel>;
  deleteOtaChannel(id: string): Promise<void>;
  
  getChannelRatePlansByChannelId(channelId: string): Promise<ChannelRatePlan[]>;
  getChannelRatePlanByChannelAndRoomType(channelId: string, roomType: string): Promise<ChannelRatePlan | undefined>;
  createChannelRatePlan(ratePlan: InsertChannelRatePlan): Promise<ChannelRatePlan>;
  updateChannelRatePlan(id: string, updates: Partial<ChannelRatePlan>): Promise<ChannelRatePlan>;
  
  getChannelInventory(channelId: string, startDate: Date, endDate: Date): Promise<ChannelInventory[]>;
  createChannelInventory(inventory: InsertChannelInventory): Promise<ChannelInventory>;
  updateChannelInventory(id: string, updates: Partial<ChannelInventory>): Promise<ChannelInventory>;
  
  getChannelSyncLogs(hotelId: string, limit?: number, offset?: number): Promise<ChannelSyncLog[]>;
  createChannelSyncLog(log: Omit<ChannelSyncLog, 'id' | 'createdAt'>): Promise<ChannelSyncLog>;
  updateChannelSyncLog(id: string, updates: Partial<ChannelSyncLog>): Promise<ChannelSyncLog>;
  
  getChannelBookings(hotelId: string, filters?: { channelId?: string; status?: string; limit?: number; offset?: number }): Promise<ChannelBooking[]>;
  createChannelBooking(booking: InsertChannelBooking): Promise<ChannelBooking>;
  
  getRoomsByHotelId(hotelId: string): Promise<Room[]>;
  getChannelAnalytics(hotelId: string): Promise<any>;
  
  // Hotel Lead methods
  getLeads(filters?: { status?: string; limit?: number; offset?: number }): Promise<{ leads: HotelLead[], total: number }>;
  getLead(id: string): Promise<HotelLead | undefined>;
  createLead(lead: InsertHotelLead): Promise<HotelLead>;
  updateLead(id: string, updates: Partial<HotelLead>): Promise<HotelLead>;
  convertLeadToHotel(leadId: string, hotelData: InsertHotel, userData: InsertUser): Promise<{ hotel: Hotel; user: User }>;
  
  // User management methods
  getUsers(filters?: { role?: string; isActive?: boolean; limit?: number; offset?: number }): Promise<{ users: User[], total: number }>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deactivateUser(id: string): Promise<User>;
  
  // Audit log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { entityType?: string; hotelId?: string; userId?: string; limit?: number; offset?: number }): Promise<{ logs: AuditLog[], total: number }>;
  
  // Self Check-in Request methods
  getSelfCheckInRequests(hotelId: string, status?: string): Promise<SelfCheckInRequest[]>;
  getSelfCheckInRequest(id: string): Promise<SelfCheckInRequest | undefined>;
  createSelfCheckInRequest(request: InsertSelfCheckInRequest): Promise<SelfCheckInRequest>;
  updateSelfCheckInRequest(id: string, updates: Partial<SelfCheckInRequest>): Promise<SelfCheckInRequest>;
  getHotelBySlug(slug: string): Promise<Hotel | undefined>;
  generateHotelSlug(hotelId: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Hotel methods
  async getHotel(id: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel || undefined;
  }

  async getHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels);
  }

  async getHotelsByOwnerId(ownerId: string): Promise<Hotel[]> {
    return await db.select().from(hotels).where(eq(hotels.ownerId, ownerId));
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const [newHotel] = await db
      .insert(hotels)
      .values(hotel as any)
      .returning();
    return newHotel;
  }

  async updateHotel(id: string, updates: Partial<Hotel>): Promise<Hotel> {
    const [updatedHotel] = await db
      .update(hotels)
      .set(updates)
      .where(eq(hotels.id, id))
      .returning();
    return updatedHotel;
  }

  async toggleHotelActive(hotelId: string): Promise<Hotel> {
    // Get current hotel state
    const hotel = await this.getHotel(hotelId);
    if (!hotel) {
      throw new Error("Hotel not found");
    }
    
    // Toggle the isActive state
    const [updatedHotel] = await db
      .update(hotels)
      .set({ isActive: !hotel.isActive })
      .where(eq(hotels.id, hotelId))
      .returning();
    
    return updatedHotel;
  }

  async getHotelByOwnerId(ownerId: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.ownerId, ownerId));
    return hotel || undefined;
  }

  async getRooms(hotelId?: string): Promise<Room[]> {
    if (hotelId) {
      return await db.select().from(rooms).where(eq(rooms.hotelId, hotelId)).orderBy(rooms.number);
    }
    return await db.select().from(rooms).orderBy(rooms.number);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomByNumber(number: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.number, number));
    return room || undefined;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db
      .insert(rooms)
      .values(room)
      .returning();
    return newRoom;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const [room] = await db
      .update(rooms)
      .set(updates)
      .where(eq(rooms.id, id))
      .returning();
    return room || undefined;
  }

  async updateRoomStatus(id: string, status: "available" | "occupied" | "cleaning" | "maintenance"): Promise<Room | undefined> {
    const [room] = await db
      .update(rooms)
      .set({ status })
      .where(eq(rooms.id, id))
      .returning();
    return room || undefined;
  }

  async getAvailableRooms(hotelId?: string): Promise<Room[]> {
    if (hotelId) {
      return await db.select().from(rooms).where(and(eq(rooms.status, "available"), eq(rooms.hotelId, hotelId))).orderBy(rooms.number);
    }
    return await db.select().from(rooms).where(eq(rooms.status, "available")).orderBy(rooms.number);
  }

  async getGuests(search?: string, limit = 50, offset = 0, hotelId?: string): Promise<{ guests: (Guest & { room?: Room; checkInDate?: Date })[], total: number }> {
    const selectFields = {
      id: guests.id,
      fullName: guests.fullName,
      phone: guests.phone,
      address: guests.address,
      comingFrom: guests.comingFrom,
      nationality: guests.nationality,
      numberOfMales: guests.numberOfMales,
      numberOfFemales: guests.numberOfFemales,
      numberOfChildren: guests.numberOfChildren,
      purposeOfVisit: guests.purposeOfVisit,
      destination: guests.destination,
      documentType: guests.documentType,
      documentNumber: guests.documentNumber,
      signature: guests.signature,
      createdAt: guests.createdAt,
      room: rooms,
      checkInDate: checkIns.checkInDate,
    };

    let conditions: any[] = [];
    if (hotelId) {
      conditions.push(eq(rooms.hotelId, hotelId));
    }
    if (search) {
      conditions.push(
        or(
          ilike(guests.fullName, `%${search}%`),
          ilike(guests.phone, `%${search}%`)
        )
      );
    }

    const results = conditions.length > 0
      ? await db
          .select(selectFields)
          .from(guests)
          .leftJoin(checkIns, and(eq(checkIns.guestId, guests.id), eq(checkIns.isActive, true)))
          .leftJoin(rooms, eq(checkIns.roomId, rooms.id))
          .where(and(...conditions))
          .orderBy(desc(guests.createdAt))
          .limit(limit)
          .offset(offset)
      : await db
          .select(selectFields)
          .from(guests)
          .leftJoin(checkIns, and(eq(checkIns.guestId, guests.id), eq(checkIns.isActive, true)))
          .leftJoin(rooms, eq(checkIns.roomId, rooms.id))
          .orderBy(desc(guests.createdAt))
          .limit(limit)
          .offset(offset);

    let totalCount;
    if (hotelId) {
      totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(guests)
        .leftJoin(checkIns, and(eq(checkIns.guestId, guests.id), eq(checkIns.isActive, true)))
        .leftJoin(rooms, eq(checkIns.roomId, rooms.id))
        .where(eq(rooms.hotelId, hotelId));
    } else {
      totalCount = await db.select({ count: sql<number>`count(*)` }).from(guests);
    }
    
    return {
      guests: results.map((r: any) => ({
        ...r,
        room: r.room || undefined,
        checkInDate: r.checkInDate || undefined
      })),
      total: totalCount[0].count
    };
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id));
    return guest || undefined;
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const [newGuest] = await db
      .insert(guests)
      .values(guest)
      .returning();
    return newGuest;
  }

  async getCheckIns(hotelId?: string): Promise<(CheckIn & { guest: Guest; room: Room })[]> {
    let results;
    if (hotelId) {
      results = await db
        .select({
          checkIn: checkIns,
          guest: guests,
          room: rooms
        })
        .from(checkIns)
        .innerJoin(guests, eq(checkIns.guestId, guests.id))
        .innerJoin(rooms, eq(checkIns.roomId, rooms.id))
        .where(eq(rooms.hotelId, hotelId))
        .orderBy(desc(checkIns.createdAt));
    } else {
      results = await db
        .select({
          checkIn: checkIns,
          guest: guests,
          room: rooms
        })
        .from(checkIns)
        .innerJoin(guests, eq(checkIns.guestId, guests.id))
        .innerJoin(rooms, eq(checkIns.roomId, rooms.id))
        .orderBy(desc(checkIns.createdAt));
    }
    
    return results.map(r => ({ ...r.checkIn, guest: r.guest, room: r.room }));
  }

  async getActiveCheckIns(hotelId?: string): Promise<(CheckIn & { guest: Guest; room: Room })[]> {
    let results;
    if (hotelId) {
      results = await db
        .select({
          checkIn: checkIns,
          guest: guests,
          room: rooms
        })
        .from(checkIns)
        .innerJoin(guests, eq(checkIns.guestId, guests.id))
        .innerJoin(rooms, eq(checkIns.roomId, rooms.id))
        .where(and(eq(checkIns.isActive, true), eq(rooms.hotelId, hotelId)))
        .orderBy(desc(checkIns.createdAt));
    } else {
      results = await db
        .select({
          checkIn: checkIns,
          guest: guests,
          room: rooms
        })
        .from(checkIns)
        .innerJoin(guests, eq(checkIns.guestId, guests.id))
        .innerJoin(rooms, eq(checkIns.roomId, rooms.id))
        .where(eq(checkIns.isActive, true))
        .orderBy(desc(checkIns.createdAt));
    }
    
    return results.map(r => ({ ...r.checkIn, guest: r.guest, room: r.room }));
  }

  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [newCheckIn] = await db
      .insert(checkIns)
      .values(checkIn)
      .returning();
    
    // Update room status to occupied
    await this.updateRoomStatus(checkIn.roomId, "occupied");
    
    return newCheckIn;
  }

  async checkOutGuest(guestId: string): Promise<void> {
    // Find active check-in
    const [activeCheckIn] = await db
      .select()
      .from(checkIns)
      .where(and(eq(checkIns.guestId, guestId), eq(checkIns.isActive, true)));
    
    if (activeCheckIn) {
      // Deactivate check-in
      await db
        .update(checkIns)
        .set({ isActive: false })
        .where(eq(checkIns.id, activeCheckIn.id));
      
      // Update room status to cleaning
      await this.updateRoomStatus(activeCheckIn.roomId, "cleaning");
    }
  }

  async getRoomStatistics(hotelId?: string): Promise<{
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
  }> {
    const conditions = hotelId ? [eq(rooms.hotelId, hotelId)] : [];
    
    const query = conditions.length > 0
      ? db.select({ status: rooms.status, count: sql<number>`count(*)` })
          .from(rooms)
          .where(and(...conditions))
          .groupBy(rooms.status)
      : db.select({ status: rooms.status, count: sql<number>`count(*)` })
          .from(rooms)
          .groupBy(rooms.status);
    
    const stats = await query;
    
    const result = {
      available: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0
    };
    
    stats.forEach(stat => {
      result[stat.status] = stat.count;
    });
    
    return result;
  }

  async getCheckInWithDetails(checkInId: string): Promise<(CheckIn & { guest: Guest; room: Room & { hotel?: Hotel } }) | undefined> {
    const [result] = await db
      .select({
        id: checkIns.id,
        guestId: checkIns.guestId,
        roomId: checkIns.roomId,
        checkInDate: checkIns.checkInDate,
        checkInTime: checkIns.checkInTime,
        checkOutDate: checkIns.checkOutDate,
        checkOutTime: checkIns.checkOutTime,
        actualCheckOutDate: checkIns.actualCheckOutDate,
        actualCheckOutTime: checkIns.actualCheckOutTime,
        roomRate: checkIns.roomRate,
        cgstRate: checkIns.cgstRate,
        sgstRate: checkIns.sgstRate,
        totalAmount: checkIns.totalAmount,
        paymentStatus: checkIns.paymentStatus,
        isActive: checkIns.isActive,
        createdAt: checkIns.createdAt,
        guest: guests,
        room: rooms,
        hotel: hotels
      })
      .from(checkIns)
      .leftJoin(guests, eq(checkIns.guestId, guests.id))
      .leftJoin(rooms, eq(checkIns.roomId, rooms.id))
      .leftJoin(hotels, eq(rooms.hotelId, hotels.id))
      .where(eq(checkIns.id, checkInId));

    if (!result || !result.guest || !result.room) return undefined;

    return {
      id: result.id,
      guestId: result.guestId,
      roomId: result.roomId,
      checkInDate: result.checkInDate,
      checkInTime: result.checkInTime,
      checkOutDate: result.checkOutDate,
      checkOutTime: result.checkOutTime,
      actualCheckOutDate: result.actualCheckOutDate,
      actualCheckOutTime: result.actualCheckOutTime,
      roomRate: result.roomRate,
      cgstRate: result.cgstRate,
      sgstRate: result.sgstRate,
      totalAmount: result.totalAmount,
      paymentStatus: result.paymentStatus,
      isActive: result.isActive,
      createdAt: result.createdAt,
      guest: result.guest,
      room: { ...result.room, hotel: result.hotel || undefined }
    };
  }

  async updateCheckOut(checkInId: string, checkOutData: { actualCheckOutDate: Date; actualCheckOutTime: string; totalAmount: number; paymentStatus: string }): Promise<void> {
    await db
      .update(checkIns)
      .set({ 
        actualCheckOutDate: checkOutData.actualCheckOutDate,
        actualCheckOutTime: checkOutData.actualCheckOutTime,
        totalAmount: checkOutData.totalAmount.toString(),
        paymentStatus: checkOutData.paymentStatus as "pending" | "paid" | "partial" | "refunded",
        isActive: false 
      })
      .where(eq(checkIns.id, checkInId));
  }

  // Booking methods
  async getBookings(hotelId?: string): Promise<BookingWithRooms[]> {
    const bookingsData = await db.query.bookings.findMany({
      with: {
        rooms: true,
      },
      where: hotelId ? eq(bookings.hotelId, hotelId) : undefined,
      orderBy: [bookings.checkInDate],
    });
    return bookingsData;
  }

  async getBooking(id: string): Promise<BookingWithRooms | undefined> {
    const booking = await db.query.bookings.findFirst({
      with: {
        rooms: true,
      },
      where: eq(bookings.id, id),
    });
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  async createBookingWithRooms(
    booking: InsertBooking,
    rooms: InsertBookingRoom[]
  ): Promise<BookingWithRooms> {
    const bookingData = {
      ...booking,
      roomType: booking.roomType || "deluxe", // Ensure roomType is never null
      roomRate: booking.roomRate || "0.00", // Ensure roomRate is never null
    };
    const [newBooking] = await db.insert(bookings).values(bookingData).returning();
    
    const roomsWithBookingId = rooms.map(room => ({
      ...room,
      bookingId: newBooking.id,
    }));
    
    const newRooms = await db.insert(bookingRooms).values(roomsWithBookingId).returning();
    
    return {
      ...newBooking,
      rooms: newRooms,
    };
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ bookingStatus: status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date, hotelId?: string): Promise<Booking[]> {
    const conditions = [
      eq(bookings.bookingStatus, "confirmed"),
      or(
        and(
          sql`${bookings.checkInDate} >= ${startDate}`,
          sql`${bookings.checkInDate} <= ${endDate}`
        ),
        and(
          sql`${bookings.checkOutDate} >= ${startDate}`,
          sql`${bookings.checkOutDate} <= ${endDate}`
        ),
        and(
          sql`${bookings.checkInDate} <= ${startDate}`,
          sql`${bookings.checkOutDate} >= ${endDate}`
        )
      )
    ];
    
    if (hotelId) {
      conditions.push(eq(bookings.hotelId, hotelId));
    }

    return await db.select().from(bookings)
      .where(and(...conditions))
      .orderBy(bookings.checkInDate);
  }

  // Invoice methods
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByHotel(hotelId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.hotelId, hotelId));
  }

  // Channel Manager methods implementation
  async getOtaChannel(id: string): Promise<OtaChannel | undefined> {
    // Stub implementation - will be functional once DB schema is properly deployed
    return undefined;
  }

  async getChannelsByHotelId(hotelId: string): Promise<OtaChannel[]> {
    return [];
  }

  async getActiveChannelsByHotelId(hotelId: string): Promise<OtaChannel[]> {
    return [];
  }

  async createOtaChannel(channel: InsertOtaChannel): Promise<OtaChannel> {
    throw new Error("Channel management requires database schema update");
  }

  async updateOtaChannel(id: string, updates: Partial<OtaChannel>): Promise<OtaChannel> {
    throw new Error("Channel management requires database schema update");
  }

  async deleteOtaChannel(id: string): Promise<void> {
    throw new Error("Channel management requires database schema update");
  }

  async getChannelRatePlansByChannelId(channelId: string): Promise<ChannelRatePlan[]> {
    return [];
  }

  async getChannelRatePlanByChannelAndRoomType(channelId: string, roomType: string): Promise<ChannelRatePlan | undefined> {
    return undefined;
  }

  async createChannelRatePlan(ratePlan: InsertChannelRatePlan): Promise<ChannelRatePlan> {
    throw new Error("Channel management requires database schema update");
  }

  async updateChannelRatePlan(id: string, updates: Partial<ChannelRatePlan>): Promise<ChannelRatePlan> {
    throw new Error("Channel management requires database schema update");
  }

  async getChannelInventory(channelId: string, startDate: Date, endDate: Date): Promise<ChannelInventory[]> {
    return [];
  }

  async createChannelInventory(inventory: InsertChannelInventory): Promise<ChannelInventory> {
    throw new Error("Channel management requires database schema update");
  }

  async updateChannelInventory(id: string, updates: Partial<ChannelInventory>): Promise<ChannelInventory> {
    throw new Error("Channel management requires database schema update");
  }

  async getChannelSyncLogs(hotelId: string, limit?: number, offset?: number): Promise<ChannelSyncLog[]> {
    return [];
  }

  async createChannelSyncLog(log: Omit<ChannelSyncLog, 'id' | 'createdAt'>): Promise<ChannelSyncLog> {
    throw new Error("Channel management requires database schema update");
  }

  async updateChannelSyncLog(id: string, updates: Partial<ChannelSyncLog>): Promise<ChannelSyncLog> {
    throw new Error("Channel management requires database schema update");
  }

  async getChannelBookings(hotelId: string, filters?: { channelId?: string; status?: string; limit?: number; offset?: number }): Promise<ChannelBooking[]> {
    return [];
  }

  async createChannelBooking(booking: InsertChannelBooking): Promise<ChannelBooking> {
    throw new Error("Channel management requires database schema update");
  }

  async getRoomsByHotelId(hotelId: string): Promise<Room[]> {
    const result = await db.select().from(rooms).where(eq(rooms.hotelId, hotelId));
    return result;
  }

  async getChannelAnalytics(hotelId: string): Promise<any> {
    return {
      totalChannels: 0,
      activeChannels: 0,
      syncStatus: "pending",
      lastSyncDate: null,
      bookingsToday: 0,
      revenue: {
        total: 0,
        byChannel: {},
      },
    };
  }

  // Hotel Lead methods
  async getLeads(filters?: { status?: string; limit?: number; offset?: number }): Promise<{ leads: HotelLead[], total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    let conditions: any[] = [];
    if (filters?.status) {
      conditions.push(eq(hotelLeads.status, filters.status as any));
    }
    
    const results = conditions.length > 0
      ? await db.select().from(hotelLeads).where(and(...conditions)).orderBy(desc(hotelLeads.createdAt)).limit(limit).offset(offset)
      : await db.select().from(hotelLeads).orderBy(desc(hotelLeads.createdAt)).limit(limit).offset(offset);
    
    const countResult = conditions.length > 0
      ? await db.select({ count: sql<number>`count(*)` }).from(hotelLeads).where(and(...conditions))
      : await db.select({ count: sql<number>`count(*)` }).from(hotelLeads);
    
    return {
      leads: results,
      total: countResult[0].count
    };
  }

  async getLead(id: string): Promise<HotelLead | undefined> {
    const [lead] = await db.select().from(hotelLeads).where(eq(hotelLeads.id, id));
    return lead || undefined;
  }

  async createLead(lead: InsertHotelLead): Promise<HotelLead> {
    const [newLead] = await db.insert(hotelLeads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: string, updates: Partial<HotelLead>): Promise<HotelLead> {
    const [updatedLead] = await db
      .update(hotelLeads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(hotelLeads.id, id))
      .returning();
    return updatedLead;
  }

  async convertLeadToHotel(leadId: string, hotelData: InsertHotel, userData: InsertUser): Promise<{ hotel: Hotel; user: User }> {
    // Create user first
    const [user] = await db.insert(users).values(userData).returning();
    
    // Create hotel with owner
    const [hotel] = await db.insert(hotels).values({
      ...hotelData,
      ownerId: user.id
    } as any).returning();
    
    // Update lead as converted
    await db.update(hotelLeads).set({
      status: "converted",
      convertedHotelId: hotel.id,
      convertedUserId: user.id,
      updatedAt: new Date()
    }).where(eq(hotelLeads.id, leadId));
    
    return { hotel, user };
  }

  // User management methods
  async getUsers(filters?: { role?: string; isActive?: boolean; limit?: number; offset?: number }): Promise<{ users: User[], total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    let conditions: any[] = [];
    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }
    
    const results = conditions.length > 0
      ? await db.select().from(users).where(and(...conditions)).orderBy(desc(users.createdAt)).limit(limit).offset(offset)
      : await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
    
    const countResult = conditions.length > 0
      ? await db.select({ count: sql<number>`count(*)` }).from(users).where(and(...conditions))
      : await db.select({ count: sql<number>`count(*)` }).from(users);
    
    return {
      users: results,
      total: countResult[0].count
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deactivateUser(id: string): Promise<User> {
    const [deactivatedUser] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return deactivatedUser;
  }

  // Audit log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(filters?: { entityType?: string; hotelId?: string; userId?: string; limit?: number; offset?: number }): Promise<{ logs: AuditLog[], total: number }> {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    
    let conditions: any[] = [];
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.hotelId) {
      conditions.push(eq(auditLogs.hotelId, filters.hotelId));
    }
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    
    const results = conditions.length > 0
      ? await db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset)
      : await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
    
    const countResult = conditions.length > 0
      ? await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(and(...conditions))
      : await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
    
    return {
      logs: results,
      total: countResult[0].count
    };
  }

  // Self Check-in Request methods
  async getSelfCheckInRequests(hotelId: string, status?: string): Promise<SelfCheckInRequest[]> {
    if (status) {
      return await db.select().from(selfCheckInRequests)
        .where(and(
          eq(selfCheckInRequests.hotelId, hotelId),
          eq(selfCheckInRequests.status, status as any)
        ))
        .orderBy(desc(selfCheckInRequests.createdAt));
    }
    return await db.select().from(selfCheckInRequests)
      .where(eq(selfCheckInRequests.hotelId, hotelId))
      .orderBy(desc(selfCheckInRequests.createdAt));
  }

  async getSelfCheckInRequest(id: string): Promise<SelfCheckInRequest | undefined> {
    const [request] = await db.select().from(selfCheckInRequests).where(eq(selfCheckInRequests.id, id));
    return request || undefined;
  }

  async createSelfCheckInRequest(request: InsertSelfCheckInRequest): Promise<SelfCheckInRequest> {
    const [newRequest] = await db.insert(selfCheckInRequests).values(request as any).returning();
    return newRequest;
  }

  async updateSelfCheckInRequest(id: string, updates: Partial<SelfCheckInRequest>): Promise<SelfCheckInRequest> {
    const [updatedRequest] = await db
      .update(selfCheckInRequests)
      .set(updates as any)
      .where(eq(selfCheckInRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async getHotelBySlug(slug: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.selfCheckInSlug, slug));
    return hotel || undefined;
  }

  async generateHotelSlug(hotelId: string): Promise<string> {
    const hotel = await this.getHotel(hotelId);
    if (!hotel) {
      throw new Error("Hotel not found");
    }
    
    // Generate a URL-safe slug from hotel name + random suffix
    const baseSlug = hotel.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;
    
    // Update the hotel with the new slug
    await db.update(hotels).set({ selfCheckInSlug: slug }).where(eq(hotels.id, hotelId));
    
    return slug;
  }
}

export const storage = new DatabaseStorage();

