import { 
  users, rooms, guests, checkIns, hotels, invoices, bookings,
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Guest, type InsertGuest,
  type CheckIn, type InsertCheckIn,
  type Hotel, type InsertHotel,
  type Invoice, type InsertInvoice,
  type Booking, type InsertBooking
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

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
  getBookings(hotelId?: string): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
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

  async getRooms(): Promise<Room[]> {
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

  async getAvailableRooms(): Promise<Room[]> {
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
  async getBookings(hotelId?: string): Promise<Booking[]> {
    if (hotelId) {
      return await db.select().from(bookings).where(eq(bookings.hotelId, hotelId)).orderBy(bookings.checkInDate);
    }
    return await db.select().from(bookings).orderBy(bookings.checkInDate);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
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
}

export const storage = new DatabaseStorage();

// Add missing import
import { sql } from "drizzle-orm";
