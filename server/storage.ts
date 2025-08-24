import { 
  users, rooms, guests, checkIns, hotels, invoices, bookings, bookingRooms,
  otaChannels, channelRatePlans, channelInventory, channelSyncLogs, channelRoomMapping, channelBookings,
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
  type OtaChannelWithRatePlans
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
  
  // Room methods
  getRooms(hotelId?: string): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByNumber(number: string, hotelId?: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
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
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  getBookingsByDateRange(startDate: Date, endDate: Date, hotelId?: string): Promise<BookingWithRooms[]>;
  
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
      .values(hotel)
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

  async getGuests(search?: string, limit = 50, offset = 0): Promise<{ guests: (Guest & { room?: Room; checkInDate?: Date })[], total: number }> {
    let baseQuery = db
      .select({
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
      })
      .from(guests)
      .leftJoin(checkIns, and(eq(checkIns.guestId, guests.id), eq(checkIns.isActive, true)))
      .leftJoin(rooms, eq(checkIns.roomId, rooms.id))
      .orderBy(desc(guests.createdAt));

    let results;
    if (search) {
      results = await baseQuery
        .where(
          or(
            ilike(guests.fullName, `%${search}%`),
            ilike(guests.phone, `%${search}%`)
          )
        )
        .limit(limit)
        .offset(offset);
    } else {
      results = await baseQuery.limit(limit).offset(offset);
    }

    const totalCount = await db.select({ count: sql<number>`count(*)` }).from(guests);
    
    return {
      guests: results.map(r => ({
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

  async getCheckIns(): Promise<(CheckIn & { guest: Guest; room: Room })[]> {
    const results = await db
      .select({
        checkIn: checkIns,
        guest: guests,
        room: rooms
      })
      .from(checkIns)
      .innerJoin(guests, eq(checkIns.guestId, guests.id))
      .innerJoin(rooms, eq(checkIns.roomId, rooms.id))
      .orderBy(desc(checkIns.createdAt));
    
    return results.map(r => ({ ...r.checkIn, guest: r.guest, room: r.room }));
  }

  async getActiveCheckIns(): Promise<(CheckIn & { guest: Guest; room: Room })[]> {
    const results = await db
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

  async getRoomStatistics(): Promise<{
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
  }> {
    const stats = await db
      .select({
        status: rooms.status,
        count: sql<number>`count(*)`
      })
      .from(rooms)
      .groupBy(rooms.status);
    
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

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ bookingStatus: status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date, hotelId?: string): Promise<Booking[]> {
    let query = db.select().from(bookings).where(
      and(
        eq(bookings.bookingStatus, "confirmed"),
        or(
          and(
            // Booking starts within range
            sql`${bookings.checkInDate} >= ${startDate}`,
            sql`${bookings.checkInDate} <= ${endDate}`
          ),
          and(
            // Booking ends within range
            sql`${bookings.checkOutDate} >= ${startDate}`,
            sql`${bookings.checkOutDate} <= ${endDate}`
          ),
          and(
            // Booking spans the entire range
            sql`${bookings.checkInDate} <= ${startDate}`,
            sql`${bookings.checkOutDate} >= ${endDate}`
          )
        )
      )
    );

    if (hotelId) {
      query = query.where(eq(bookings.hotelId, hotelId));
    }

    return await query.orderBy(bookings.checkInDate);
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
}

export const storage = new DatabaseStorage();

