import { 
  users, rooms, guests, checkIns,
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Guest, type InsertGuest,
  type CheckIn, type InsertCheckIn
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Room methods
  getRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByNumber(number: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoomStatus(id: string, status: "available" | "occupied" | "cleaning" | "maintenance"): Promise<Room | undefined>;
  getAvailableRooms(): Promise<Room[]>;
  
  // Guest methods
  getGuests(search?: string, limit?: number, offset?: number): Promise<{ guests: (Guest & { room?: Room; checkInDate?: Date })[], total: number }>;
  getGuest(id: string): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  
  // Check-in methods
  getCheckIns(): Promise<(CheckIn & { guest: Guest; room: Room })[]>;
  getActiveCheckIns(): Promise<(CheckIn & { guest: Guest; room: Room })[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  checkOutGuest(guestId: string): Promise<void>;
  
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
    let query = db
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
        signature: guests.signature,
        createdAt: guests.createdAt,
        room: rooms,
        checkInDate: checkIns.checkInDate,
      })
      .from(guests)
      .leftJoin(checkIns, and(eq(checkIns.guestId, guests.id), eq(checkIns.isActive, true)))
      .leftJoin(rooms, eq(checkIns.roomId, rooms.id))
      .orderBy(desc(guests.createdAt));

    if (search) {
      query = query.where(
        or(
          ilike(guests.fullName, `%${search}%`),
          ilike(guests.phone, `%${search}%`),
          ilike(rooms.number, `%${search}%`)
        )
      );
    }

    const results = await query.limit(limit).offset(offset);
    const totalCount = await db.select({ count: sql<number>`count(*)` }).from(guests);
    
    return {
      guests: results,
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
    return await db
      .select()
      .from(checkIns)
      .innerJoin(guests, eq(checkIns.guestId, guests.id))
      .innerJoin(rooms, eq(checkIns.roomId, rooms.id))
      .orderBy(desc(checkIns.createdAt));
  }

  async getActiveCheckIns(): Promise<(CheckIn & { guest: Guest; room: Room })[]> {
    return await db
      .select()
      .from(checkIns)
      .innerJoin(guests, eq(checkIns.guestId, guests.id))
      .innerJoin(rooms, eq(checkIns.roomId, rooms.id))
      .where(eq(checkIns.isActive, true))
      .orderBy(desc(checkIns.createdAt));
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
}

export const storage = new DatabaseStorage();

// Add missing import
import { sql } from "drizzle-orm";
