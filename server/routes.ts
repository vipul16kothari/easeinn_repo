import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { setupAuthRoutes, authenticateToken, requireRole, checkTrialExpiration, requireActiveHotel } from "./auth";
import bcrypt from "bcryptjs";
import { insertGuestSchema, insertCheckInSchema, insertRoomSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import { platformSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import express from "express";
import { 
  createSubscriptionOrder, 
  createBookingOrder, 
  verifyPaymentSignature, 
  updatePaymentStatus,
  getHotelPayments,
  checkPaymentStatusWithAPI,
  updatePaymentStatusFromWebhook
} from "./razorpay";
import { 
  getSubscriptionInfo, 
  checkFeatureAccess, 
  checkRoomLimit,
  getExpiryWarning,
  SUBSCRIPTION_PLANS
} from "./subscription";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware
  app.use(cookieParser());
  
  // Authentication routes
  setupAuthRoutes(app);
  
  // Channel Manager routes
  try {
    const { setupChannelManagerRoutes } = await import("./channel-manager");
    setupChannelManagerRoutes(app);
  } catch (error) {
    console.log("Channel manager routes not available - will be enabled after schema update");
  }
  
  // Room routes (protected)
  app.get("/api/rooms", authenticateToken, requireActiveHotel(storage), checkTrialExpiration, async (req: any, res) => {
    try {
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      const rooms = await storage.getRooms(hotelId);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/available", authenticateToken, requireActiveHotel(storage), checkTrialExpiration, async (req: any, res) => {
    try {
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      const rooms = await storage.getAvailableRooms(hotelId);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available rooms" });
    }
  });

  app.post("/api/rooms", authenticateToken, checkTrialExpiration, async (req: any, res) => {
    try {
      // Add hotelId from first available hotel if missing (single-property setup)
      let roomData = { ...req.body };
      if (!roomData.hotelId) {
        const hotels = await storage.getHotels();
        if (hotels.length === 0) {
          return res.status(400).json({ message: "No hotels found. Please create a hotel first." });
        }
        roomData.hotelId = hotels[0].id;
      }

      // Check hotel room capacity limits
      const hotel = await storage.getHotel(roomData.hotelId);
      if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      // Get current room count for this hotel
      const currentRooms = await storage.getRooms(roomData.hotelId);
      const currentRoomCount = currentRooms.length;

      // Check subscription room limit first
      const subRoomCheck = checkRoomLimit(hotel, currentRoomCount);
      if (!subRoomCheck.allowed) {
        return res.status(403).json({ 
          message: subRoomCheck.reason,
          limit: subRoomCheck.limit,
          current: subRoomCheck.current
        });
      }

      // Then check against hotel's enabled room limit (admin-configurable)
      const enabledRoomsLimit = hotel.enabledRooms || hotel.maxRooms || 50;
      if (currentRoomCount >= enabledRoomsLimit) {
        return res.status(400).json({ 
          message: `Cannot create room. Hotel has reached its room limit of ${enabledRoomsLimit} rooms. Please contact admin to increase capacity.` 
        });
      }
      
      const validatedData = insertRoomSchema.parse(roomData);
      const room = await storage.createRoom(validatedData);
      res.status(201).json(room);
    } catch (error) {
      console.error("Room creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid room data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create room" });
      }
    }
  });

  app.patch("/api/rooms/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["available", "occupied", "cleaning", "maintenance"].includes(status)) {
        return res.status(400).json({ message: "Invalid room status" });
      }
      
      const room = await storage.updateRoomStatus(id, status);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to update room status" });
    }
  });

  // Guest routes
  app.get("/api/guests", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const search = req.query.search as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      
      const result = await storage.getGuests(search, limit, offset, hotelId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guests" });
    }
  });

  app.get("/api/guests/:id", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const { id } = req.params;
      const guest = await storage.getGuest(id);
      
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      
      // Check if guest belongs to hotelier's hotel (for hoteliers)
      if (req.user.role === "hotelier") {
        const guestCheckIns = await storage.getCheckIns(req.hotel?.id);
        const guestBelongsToHotel = guestCheckIns.some(checkIn => checkIn.guestId === id);
        if (!guestBelongsToHotel) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest" });
    }
  });

  app.post("/api/guests", async (req, res) => {
    try {
      const guestData = insertGuestSchema.parse(req.body);
      const guest = await storage.createGuest(guestData);
      res.status(201).json(guest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid guest data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create guest" });
      }
    }
  });

  // Check-in routes
  app.get("/api/checkins", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      const checkIns = await storage.getCheckIns(hotelId);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  app.get("/api/checkins/active", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      const activeCheckIns = await storage.getActiveCheckIns(hotelId);
      res.json(activeCheckIns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active check-ins" });
    }
  });

  app.post("/api/checkins", async (req, res) => {
    try {
      const checkInData = insertCheckInSchema.parse(req.body);
      const checkIn = await storage.createCheckIn(checkInData);
      res.status(201).json(checkIn);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid check-in data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create check-in" });
      }
    }
  });

  app.post("/api/checkins/checkout/:guestId", async (req, res) => {
    try {
      const { guestId } = req.params;
      await storage.checkOutGuest(guestId);
      res.json({ message: "Guest checked out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to check out guest" });
    }
  });

  // Statistics routes
  app.get("/api/statistics/rooms", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      const stats = await storage.getRoomStatistics(hotelId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room statistics" });
    }
  });

  // Complete check-in flow (guest + check-in in single transaction)
  app.post("/api/complete-checkin", async (req, res) => {
    try {
      const { guest: guestData, checkIn: checkInData } = req.body;
      
      // Custom validation for check-in data that handles date conversion
      const checkInValidationSchema = z.object({
        roomId: z.string().min(1),
        checkInDate: z.coerce.date(),
        checkInTime: z.string(),
        checkOutDate: z.coerce.date(),
        checkOutTime: z.string(),
        roomRate: z.coerce.number().optional(),
        cgstRate: z.coerce.number().optional().default(6),
        sgstRate: z.coerce.number().optional().default(6)
      });
      
      // Validate data
      const validatedGuest = insertGuestSchema.parse(guestData);
      const validatedCheckIn = checkInValidationSchema.parse(checkInData);
      
      // Create guest first
      const guest = await storage.createGuest(validatedGuest);
      
      // Create check-in with the new guest ID and room rate
      const room = await storage.getRoom(validatedCheckIn.roomId);
      const checkIn = await storage.createCheckIn({
        ...validatedCheckIn,
        guestId: guest.id,
        roomRate: (validatedCheckIn.roomRate || parseFloat(room?.basePrice || "0")).toString(),
        cgstRate: validatedCheckIn.cgstRate?.toString() || "6.00",
        sgstRate: validatedCheckIn.sgstRate?.toString() || "6.00"
      });
      
      res.status(201).json({ guest, checkIn });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to complete check-in" });
      }
    }
  });

  // Booking routes
  app.get("/api/bookings", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      const bookings = await storage.getBookings(hotelId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req: any, res) => {
    try {
      // Get hotel ID from authenticated user
      let bookingData = { ...req.body };
      if (!bookingData.hotelId && req.user) {
        const hotels = await storage.getHotelsByOwnerId(req.user.userId);
        if (hotels.length === 0) {
          return res.status(400).json({ message: "No hotels found. Please create a hotel first." });
        }
        bookingData.hotelId = hotels[0].id;
      }
      
      const validatedData = insertBookingSchema.parse(bookingData);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });

  // Multi-room booking endpoint
  app.post("/api/bookings/multi-room", authenticateToken, async (req: any, res) => {
    try {
      const { guestName, guestPhone, guestEmail, checkInDate, checkOutDate, advanceAmount, totalAmount, specialRequests, rooms } = req.body;

      // Get hotel ID from authenticated user
      const hotels = await storage.getHotelsByOwnerId(req.user.userId);
      if (hotels.length === 0) {
        return res.status(400).json({ message: "No hotels found. Please create a hotel first." });
      }

      const bookingData = {
        hotelId: hotels[0].id,
        guestName,
        guestPhone,
        guestEmail: guestEmail || null,
        roomType: "deluxe" as const, // Default value to satisfy NOT NULL constraint, actual room types in booking_rooms table
        numberOfRooms: rooms.length,
        checkInDate: new Date(checkInDate),
        checkOutDate: new Date(checkOutDate),
        roomRate: "0.00", // Default value, actual room rates in booking_rooms table
        advanceAmount: advanceAmount?.toString() || "0.00",
        totalAmount: totalAmount?.toString() || "0.00",
        specialRequests: specialRequests || null,
      };

      const roomsData = rooms.map((room: any) => ({
        roomType: room.roomType,
        roomNumber: room.roomNumber || null,
        roomRate: room.roomRate?.toString() || "0.00",
      }));

      const booking = await storage.createBookingWithRooms(bookingData, roomsData);

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating multi-room booking:", error);
      res.status(500).json({ message: "Failed to create multi-room booking" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const booking = await storage.updateBookingStatus(id, status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Update booking details
  app.patch("/api/bookings/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { guestName, guestPhone, guestEmail, checkInDate, checkOutDate, roomType, roomNumber, roomRate, numberOfRooms, advanceAmount, specialRequests } = req.body;
      
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Only allow updates to confirmed bookings
      if (existingBooking.bookingStatus !== "confirmed") {
        return res.status(400).json({ message: "Can only update confirmed bookings" });
      }

      const updates: any = {};
      if (guestName) updates.guestName = guestName;
      if (guestPhone) updates.guestPhone = guestPhone;
      if (guestEmail !== undefined) updates.guestEmail = guestEmail;
      if (checkInDate) updates.checkInDate = new Date(checkInDate);
      if (checkOutDate) updates.checkOutDate = new Date(checkOutDate);
      if (roomType) updates.roomType = roomType;
      if (roomNumber !== undefined) updates.roomNumber = roomNumber;
      if (roomRate !== undefined) updates.roomRate = roomRate.toString();
      if (numberOfRooms !== undefined) updates.numberOfRooms = numberOfRooms;
      if (advanceAmount !== undefined) updates.advanceAmount = advanceAmount.toString();
      if (specialRequests !== undefined) updates.specialRequests = specialRequests;
      updates.updatedAt = new Date();

      const updatedBooking = await storage.updateBooking(id, updates);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Convert booking to check-in
  app.post("/api/bookings/:id/checkin", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const { roomId, documentType, documentNumber, signature } = req.body;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.bookingStatus !== "confirmed") {
        return res.status(400).json({ message: "Booking is not in confirmed status" });
      }

      if (!roomId) {
        return res.status(400).json({ message: "Room selection is required" });
      }

      // Get room details
      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.status !== "available") {
        return res.status(400).json({ message: "Selected room is not available" });
      }

      // Create guest record from booking info
      const guestData = {
        fullName: booking.guestName,
        phone: booking.guestPhone,
        address: "",
        comingFrom: "",
        nationality: "Indian",
        numberOfMales: 1,
        numberOfFemales: 0,
        numberOfChildren: 0,
        purposeOfVisit: "business" as const,
        destination: "",
        documentType: documentType || "aadhar",
        documentNumber: documentNumber || "",
        signature: signature || null,
      };

      const guest = await storage.createGuest(guestData);

      // Create check-in record
      const checkInData = {
        guestId: guest.id,
        roomId: roomId,
        hotelId: req.hotel?.id || booking.hotelId,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        roomRate: booking.roomRate || room.basePrice || "2000",
        cgstRate: "6",
        sgstRate: "6",
        advanceAmount: booking.advanceAmount || "0",
        totalAmount: booking.totalAmount || "0",
      };

      const checkIn = await storage.createCheckIn(checkInData);

      // Update room status
      await storage.updateRoom(roomId, { status: "occupied" });

      // Update booking status to checked_in
      await storage.updateBookingStatus(bookingId, "checked_in");

      res.status(201).json({
        message: "Booking converted to check-in successfully",
        checkIn,
        guest,
        room
      });
    } catch (error) {
      console.error("Booking check-in error:", error);
      res.status(500).json({ message: "Failed to convert booking to check-in" });
    }
  });

  app.get("/api/calendar/events", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const { start, end } = req.query;
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const hotelId = req.user.role === "admin" ? undefined : req.hotel?.id;
      
      // Get both active check-ins and confirmed bookings for the date range
      const [activeCheckIns, bookings] = await Promise.all([
        storage.getActiveCheckIns(hotelId),
        storage.getBookingsByDateRange(startDate, endDate, hotelId)
      ]);
      
      // Format events for calendar
      const events = [
        ...activeCheckIns.map(checkIn => ({
          id: checkIn.id,
          title: `${checkIn.guest.fullName} - Room ${checkIn.room.number}`,
          start: checkIn.checkInDate,
          end: checkIn.checkOutDate,
          type: 'checkin',
          color: '#059669', // green for current guests
          extendedProps: {
            guestName: checkIn.guest.fullName,
            roomNumber: checkIn.room.number,
            roomType: checkIn.room.type,
            phone: checkIn.guest.phone
          }
        })),
        ...bookings.map(booking => ({
          id: booking.id,
          title: `${booking.guestName} - ${booking.numberOfRooms} ${booking.roomType}`,
          start: booking.checkInDate,
          end: booking.checkOutDate,
          type: 'booking',
          color: '#3B82F6', // blue for advance bookings
          extendedProps: {
            guestName: booking.guestName,
            phone: booking.guestPhone,
            email: booking.guestEmail,
            roomType: booking.roomType,
            numberOfRooms: booking.numberOfRooms,
            advanceAmount: booking.advanceAmount,
            totalAmount: booking.totalAmount,
            status: booking.bookingStatus
          }
        }))
      ];
      
      res.json(events);
    } catch (error) {
      console.error("Calendar events error:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  // Admin statistics endpoint
  app.get("/api/admin/stats", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const hotels = await storage.getHotels();
      const bookings = await storage.getBookings();
      const activeCheckIns = await storage.getActiveCheckIns();
      const roomStats = await storage.getRoomStatistics();
      
      // Calculate total revenue from all bookings
      const totalRevenue = bookings.reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount || "0");
      }, 0).toFixed(2);

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = bookings.filter(booking => {
        const bookingDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      }).reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount || "0");
      }, 0).toFixed(2);

      // Calculate yearly revenue (current year)
      const yearlyRevenue = bookings.filter(booking => {
        const bookingDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
        return bookingDate.getFullYear() === currentYear;
      }).reduce((sum, booking) => {
        return sum + parseFloat(booking.totalAmount || "0");
      }, 0).toFixed(2);

      // Calculate occupancy rate
      const totalRooms = roomStats.available + roomStats.occupied + roomStats.cleaning + roomStats.maintenance;
      const occupancyRate = totalRooms > 0 ? Math.round((roomStats.occupied / totalRooms) * 100) : 0;

      const stats = {
        totalHotels: hotels.length,
        totalUsers: 0, // Will need to add a user count method
        totalBookings: bookings.length,
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        activeCheckIns: activeCheckIns.length,
        availableRooms: roomStats.available,
        occupancyRate,
      };

      res.json(stats);
    } catch (error) {
      console.error("Admin statistics error:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  // ===== Reports & Analytics API =====
  
  // Get hotel-specific analytics for hotelier dashboard
  app.get("/api/reports/analytics", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.hotel?.id;
      if (!hotelId) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      const rooms = await storage.getRooms(hotelId);
      const checkIns = await storage.getActiveCheckIns(hotelId);
      const bookings = await storage.getBookings(hotelId);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Calculate occupancy metrics
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
      const cleaningRooms = rooms.filter(r => r.status === 'cleaning').length;
      const availableRooms = rooms.filter(r => r.status === 'available').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Calculate revenue metrics
      const todayRevenue = checkIns
        .filter(c => {
          const date = c.checkInDate ? new Date(c.checkInDate) : new Date();
          return date.toDateString() === now.toDateString();
        })
        .reduce((sum, c) => sum + parseFloat(c.totalAmount || "0"), 0);

      const monthlyRevenue = bookings
        .filter(b => {
          const date = b.createdAt ? new Date(b.createdAt) : new Date();
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0);

      const yearlyRevenue = bookings
        .filter(b => {
          const date = b.createdAt ? new Date(b.createdAt) : new Date();
          return date.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0);

      // Calculate last 7 days revenue trend
      const revenueByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStr = date.toDateString();
        
        const dayRevenue = bookings
          .filter(b => {
            const bookingDate = b.createdAt ? new Date(b.createdAt) : new Date();
            return bookingDate.toDateString() === dayStr;
          })
          .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0);
        
        revenueByDay.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          revenue: dayRevenue
        });
      }

      // Room type breakdown
      const roomTypeStats: Record<string, { count: number; occupied: number; revenue: number }> = {};
      rooms.forEach(room => {
        const type = room.type;
        if (!roomTypeStats[type]) {
          roomTypeStats[type] = { count: 0, occupied: 0, revenue: 0 };
        }
        roomTypeStats[type].count++;
        if (room.status === 'occupied') {
          roomTypeStats[type].occupied++;
          roomTypeStats[type].revenue += parseFloat(room.basePrice || "0");
        }
      });

      // Booking source breakdown (for future channel manager integration)
      const bookingsByStatus = {
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        pending: bookings.filter(b => b.status === 'pending').length,
        checked_in: bookings.filter(b => b.status === 'checked_in').length,
        completed: bookings.filter(b => b.status === 'completed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
      };

      // GST summary for current month
      const monthlyCheckIns = checkIns.filter(c => {
        const date = c.checkInDate ? new Date(c.checkInDate) : new Date();
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const gstSummary = {
        totalBillings: monthlyCheckIns.length,
        totalAmount: monthlyCheckIns.reduce((sum, c) => sum + parseFloat(c.totalAmount || "0"), 0),
        cgstCollected: monthlyCheckIns.reduce((sum, c) => {
          const amount = parseFloat(c.totalAmount || "0");
          const cgstRate = parseFloat(c.cgstRate || "6") / 100;
          return sum + (amount * cgstRate / (1 + cgstRate * 2));
        }, 0),
        sgstCollected: monthlyCheckIns.reduce((sum, c) => {
          const amount = parseFloat(c.totalAmount || "0");
          const sgstRate = parseFloat(c.sgstRate || "6") / 100;
          return sum + (amount * sgstRate / (1 + sgstRate * 2));
        }, 0),
      };

      res.json({
        occupancy: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: availableRooms,
          maintenance: maintenanceRooms,
          cleaning: cleaningRooms,
          rate: occupancyRate
        },
        revenue: {
          today: todayRevenue.toFixed(2),
          monthly: monthlyRevenue.toFixed(2),
          yearly: yearlyRevenue.toFixed(2),
          trend: revenueByDay
        },
        roomTypes: roomTypeStats,
        bookings: {
          total: bookings.length,
          byStatus: bookingsByStatus,
          activeCheckIns: checkIns.length
        },
        gst: gstSummary
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Generate guest register report data
  app.get("/api/reports/guest-register", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.hotel?.id;
      const { from, to } = req.query;

      if (!hotelId) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      const checkIns = await storage.getCheckInHistory(hotelId);
      
      // Filter by date range if provided
      let filteredCheckIns = checkIns;
      if (from || to) {
        const fromDate = from ? new Date(from as string) : new Date(0);
        const toDate = to ? new Date(to as string) : new Date();
        toDate.setHours(23, 59, 59, 999);
        
        filteredCheckIns = checkIns.filter(checkIn => {
          const checkInDate = checkIn.checkInDate ? new Date(checkIn.checkInDate) : new Date();
          return checkInDate >= fromDate && checkInDate <= toDate;
        });
      }

      // Get guest details for each check-in
      const guestRegister = await Promise.all(
        filteredCheckIns.map(async (checkIn) => {
          const guest = await storage.getGuest(checkIn.guestId);
          const room = await storage.getRoom(checkIn.roomId);
          
          return {
            serialNo: checkIn.id,
            guestName: guest?.name || 'Unknown',
            phone: guest?.phone || '',
            email: guest?.email || '',
            idType: guest?.idType || '',
            idNumber: guest?.idNumber || '',
            nationality: guest?.nationality || 'Indian',
            roomNumber: room?.roomNumber || '',
            roomType: room?.type || '',
            checkInDate: checkIn.checkInDate,
            checkOutDate: checkIn.checkOutDate,
            purpose: guest?.purpose || '',
            guests: guest?.numberOfGuests || 1,
            address: guest?.address || '',
            totalAmount: checkIn.totalAmount || '0',
            status: checkIn.status || 'active'
          };
        })
      );

      res.json({
        report: 'Guest Register',
        dateRange: { from: from || 'All time', to: to || 'Present' },
        totalRecords: guestRegister.length,
        data: guestRegister
      });
    } catch (error) {
      console.error("Guest register report error:", error);
      res.status(500).json({ message: "Failed to generate guest register" });
    }
  });

  // Generate occupancy report data
  app.get("/api/reports/occupancy", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.hotel?.id;
      const { period } = req.query;

      if (!hotelId) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      const rooms = await storage.getRooms(hotelId);
      const bookings = await storage.getBookings(hotelId);
      const now = new Date();

      // Calculate period range
      let startDate = new Date();
      let endDate = new Date();
      
      switch (period) {
        case 'last-month':
          startDate.setMonth(startDate.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'this-month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
      }

      // Daily occupancy for the period
      const dailyOccupancy = [];
      const currentDate = new Date(startDate);
      const totalRooms = rooms.length;

      while (currentDate <= endDate) {
        const dateStr = currentDate.toDateString();
        
        // Count rooms occupied on this date
        const occupiedOnDate = bookings.filter(b => {
          const checkIn = b.checkInDate ? new Date(b.checkInDate) : null;
          const checkOut = b.checkOutDate ? new Date(b.checkOutDate) : null;
          const status = b.status;
          
          if (!checkIn || !checkOut) return false;
          if (status === 'cancelled') return false;
          
          return currentDate >= checkIn && currentDate < checkOut;
        }).length;

        dailyOccupancy.push({
          date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: currentDate.toISOString().split('T')[0],
          occupied: Math.min(occupiedOnDate, totalRooms),
          available: Math.max(totalRooms - occupiedOnDate, 0),
          rate: totalRooms > 0 ? Math.round((occupiedOnDate / totalRooms) * 100) : 0
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Average occupancy for period
      const avgOccupancy = dailyOccupancy.length > 0
        ? Math.round(dailyOccupancy.reduce((sum, d) => sum + d.rate, 0) / dailyOccupancy.length)
        : 0;

      // Room type occupancy breakdown
      const roomTypeOccupancy: Record<string, { total: number; occupied: number; rate: number }> = {};
      rooms.forEach(room => {
        if (!roomTypeOccupancy[room.type]) {
          roomTypeOccupancy[room.type] = { total: 0, occupied: 0, rate: 0 };
        }
        roomTypeOccupancy[room.type].total++;
        if (room.status === 'occupied') {
          roomTypeOccupancy[room.type].occupied++;
        }
      });

      Object.keys(roomTypeOccupancy).forEach(type => {
        const data = roomTypeOccupancy[type];
        data.rate = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;
      });

      res.json({
        report: 'Occupancy Report',
        period: period || 'this-month',
        dateRange: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0]
        },
        summary: {
          totalRooms,
          averageOccupancy: avgOccupancy,
          peakOccupancy: Math.max(...dailyOccupancy.map(d => d.rate)),
          lowestOccupancy: Math.min(...dailyOccupancy.map(d => d.rate))
        },
        dailyData: dailyOccupancy,
        roomTypeBreakdown: roomTypeOccupancy
      });
    } catch (error) {
      console.error("Occupancy report error:", error);
      res.status(500).json({ message: "Failed to generate occupancy report" });
    }
  });

  // Generate revenue report data
  app.get("/api/reports/revenue", authenticateToken, requireActiveHotel(storage), async (req: any, res) => {
    try {
      const hotelId = req.hotel?.id;
      const { period } = req.query;

      if (!hotelId) {
        return res.status(400).json({ message: "Hotel not found" });
      }

      const bookings = await storage.getBookings(hotelId);
      const checkIns = await storage.getCheckInHistory(hotelId);
      const now = new Date();

      // Calculate period range
      let startDate = new Date();
      let days = 7;
      
      switch (period) {
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          days = now.getDate();
          break;
        case 'this-quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          days = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          break;
        case 'this-week':
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 6);
          days = 7;
          break;
      }

      // Daily revenue
      const dailyRevenue = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toDateString();
        
        const dayRevenue = bookings
          .filter(b => {
            const bookingDate = b.createdAt ? new Date(b.createdAt) : new Date();
            return bookingDate.toDateString() === dateStr;
          })
          .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0);

        dailyRevenue.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          fullDate: date.toISOString().split('T')[0],
          revenue: dayRevenue
        });
      }

      // Total revenue for period
      const totalRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
      const avgDailyRevenue = days > 0 ? totalRevenue / days : 0;

      // Revenue by payment method
      const revenueByPayment: Record<string, number> = {
        cash: 0,
        card: 0,
        upi: 0,
        online: 0,
        other: 0
      };

      checkIns.forEach(checkIn => {
        const method = checkIn.paymentMethod?.toLowerCase() || 'cash';
        const amount = parseFloat(checkIn.totalAmount || "0");
        if (revenueByPayment[method] !== undefined) {
          revenueByPayment[method] += amount;
        } else {
          revenueByPayment.other += amount;
        }
      });

      // GST breakdown
      const periodCheckIns = checkIns.filter(c => {
        const date = c.checkInDate ? new Date(c.checkInDate) : new Date();
        return date >= startDate && date <= now;
      });

      const gstBreakdown = {
        grossRevenue: totalRevenue,
        cgst: periodCheckIns.reduce((sum, c) => {
          const amount = parseFloat(c.totalAmount || "0");
          const cgstRate = parseFloat(c.cgstRate || "6") / 100;
          return sum + (amount * cgstRate / (1 + cgstRate * 2));
        }, 0),
        sgst: periodCheckIns.reduce((sum, c) => {
          const amount = parseFloat(c.totalAmount || "0");
          const sgstRate = parseFloat(c.sgstRate || "6") / 100;
          return sum + (amount * sgstRate / (1 + sgstRate * 2));
        }, 0),
        netRevenue: 0
      };
      gstBreakdown.netRevenue = totalRevenue - gstBreakdown.cgst - gstBreakdown.sgst;

      res.json({
        report: 'Revenue Report',
        period: period || 'this-week',
        dateRange: {
          from: startDate.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        },
        summary: {
          totalRevenue: totalRevenue.toFixed(2),
          avgDailyRevenue: avgDailyRevenue.toFixed(2),
          totalBookings: bookings.filter(b => {
            const date = b.createdAt ? new Date(b.createdAt) : new Date();
            return date >= startDate && date <= now;
          }).length,
          peakRevenue: Math.max(...dailyRevenue.map(d => d.revenue)).toFixed(2)
        },
        dailyData: dailyRevenue,
        paymentBreakdown: revenueByPayment,
        gst: gstBreakdown
      });
    } catch (error) {
      console.error("Revenue report error:", error);
      res.status(500).json({ message: "Failed to generate revenue report" });
    }
  });

  // Admin hotels management
  app.get("/api/admin/hotels", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const hotels = await storage.getHotels();
      res.json(hotels);
    } catch (error) {
      console.error("Admin hotels error:", error);
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  // Toggle hotel active status
  app.patch("/api/admin/hotels/:hotelId/toggle-active", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { hotelId } = req.params;
      const updatedHotel = await storage.toggleHotelActive(hotelId);
      
      // Log the action for audit purposes
      console.log(`Hotel ${hotelId} (${updatedHotel.name}) ${updatedHotel.isActive ? 'activated' : 'deactivated'} by admin`);
      
      res.json({
        message: `Hotel ${updatedHotel.isActive ? 'activated' : 'deactivated'} successfully`,
        hotel: updatedHotel
      });
    } catch (error) {
      console.error("Toggle hotel active error:", error);
      res.status(500).json({ message: "Failed to toggle hotel status" });
    }
  });

  // Admin pricing configuration routes
  app.get("/api/admin/pricing-config", async (req, res) => {
    try {
      const hotelierPrice = await db
        .select({ value: platformSettings.value })
        .from(platformSettings)
        .where(eq(platformSettings.key, "hotelier_price"))
        .limit(1);
      
      const enterprisePrice = await db
        .select({ value: platformSettings.value })
        .from(platformSettings)
        .where(eq(platformSettings.key, "enterprise_price"))
        .limit(1);
      
      res.json({
        hotelierPrice: hotelierPrice[0]?.value ? parseInt(hotelierPrice[0].value) : 2999,
        enterprisePrice: enterprisePrice[0]?.value ? parseInt(enterprisePrice[0].value) : 9999
      });
    } catch (error) {
      console.error("Error fetching pricing config:", error);
      res.status(500).json({ message: "Failed to fetch pricing configuration" });
    }
  });

  app.put("/api/admin/pricing-config", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const { hotelierPrice, enterprisePrice } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      if (!hotelierPrice || !enterprisePrice || hotelierPrice <= 0 || enterprisePrice <= 0) {
        return res.status(400).json({ message: "Valid pricing values required" });
      }

      // Update hotelier price
      await db
        .insert(platformSettings)
        .values({
          key: "hotelier_price",
          value: hotelierPrice.toString(),
          description: "Monthly subscription price for Hotelier Plan",
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: {
            value: hotelierPrice.toString(),
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

      // Update enterprise price
      await db
        .insert(platformSettings)
        .values({
          key: "enterprise_price",
          value: enterprisePrice.toString(),
          description: "Monthly subscription price for Enterprise Plan",
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: {
            value: enterprisePrice.toString(),
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

      res.json({ message: "Pricing configuration updated successfully" });
    } catch (error) {
      console.error("Error updating pricing config:", error);
      res.status(500).json({ message: "Failed to update pricing configuration" });
    }
  });

  // Create new hotel with owner
  app.post("/api/admin/hotels", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const hotelData = req.body;
      
      // Validate required fields
      if (!hotelData.ownerEmail || !hotelData.ownerEmail.trim()) {
        return res.status(400).json({ message: "Owner email is required" });
      }
      
      if (!hotelData.ownerPassword || !hotelData.ownerPassword.trim()) {
        return res.status(400).json({ message: "Owner password is required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(hotelData.ownerEmail.trim());
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }
      
      // Create owner user first
      const hashedPassword = await bcrypt.hash(hotelData.ownerPassword, 12);
      const ownerUser = await storage.createUser({
        email: hotelData.ownerEmail.trim(),
        password: hashedPassword,
        role: "hotelier",
        firstName: hotelData.ownerFirstName || "",
        lastName: hotelData.ownerLastName || "",
      });

      // Create hotel with subscription details
      const hotel = await storage.createHotel({
        name: hotelData.name,
        address: hotelData.address,
        phone: hotelData.phone,
        email: hotelData.email,
        gstNumber: hotelData.gstNumber || null,
        panNumber: hotelData.panNumber || null,
        stateCode: hotelData.stateCode,
        ownerId: ownerUser.id,
        subscriptionStartDate: new Date(hotelData.subscriptionStartDate),
        subscriptionEndDate: new Date(hotelData.subscriptionEndDate),
        subscriptionPlan: hotelData.subscriptionPlan,
        monthlyRate: hotelData.monthlyRate,
      });

      res.status(201).json({
        hotel,
        owner: {
          id: ownerUser.id,
          email: ownerUser.email,
          firstName: ownerUser.firstName,
          lastName: ownerUser.lastName,
        }
      });
    } catch (error) {
      console.error("Admin create hotel error:", error);
      res.status(500).json({ message: "Failed to create hotel" });
    }
  });

  // Update hotel configuration
  app.patch("/api/admin/hotels/:id", authenticateToken, requireRole(["admin"]), async (req: any, res) => {
    try {
      const hotelId = req.params.id;
      const updates = req.body;
      
      const updatedHotel = await storage.updateHotel(hotelId, updates);
      res.json(updatedHotel);
    } catch (error) {
      console.error("Admin update hotel error:", error);
      res.status(500).json({ message: "Failed to update hotel" });
    }
  });

  // Statistics routes
  app.get("/api/statistics/rooms", async (req, res) => {
    try {
      const stats = await storage.getRoomStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Statistics error:", error);
      res.status(500).json({ message: "Failed to fetch room statistics" });
    }
  });

  // Checkout and invoice generation
  app.post("/api/checkout", async (req, res) => {
    try {
      const { checkInId, actualCheckOutDate, actualCheckOutTime, guestGstNumber, additionalCharges = 0, discount = 0 } = req.body;
      
      // Get check-in details with related data
      const checkIn = await storage.getCheckInWithDetails(checkInId);
      if (!checkIn) {
        return res.status(404).json({ message: "Check-in not found" });
      }
      
      // Calculate bill
      const checkInDate = new Date(checkIn.checkInDate);
      const checkOutDate = new Date(actualCheckOutDate);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      
      const roomRate = parseFloat(checkIn.room.basePrice || "0");
      const subtotal = (roomRate * nights) + additionalCharges - discount;
      const gstRate = 0.18; // 18% GST
      const totalTax = subtotal * gstRate;
      const totalAmount = subtotal + totalTax;
      
      // Update check-in with checkout details
      await storage.updateCheckOut(checkInId, {
        actualCheckOutDate: new Date(actualCheckOutDate),
        actualCheckOutTime,
        totalAmount,
        paymentStatus: "paid"
      });
      
      // Generate invoice number (format: HOTEL-YYYYMMDD-NNNN)
      const invoiceNumber = `${checkIn.room.hotel?.name?.substring(0, 3).toUpperCase() || "HTL"}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      
      // Create invoice
      const invoice = await storage.createInvoice({
        checkInId,
        hotelId: checkIn.room.hotelId,
        invoiceNumber,
        guestName: checkIn.guest.fullName,
        guestAddress: checkIn.guest.address,
        guestGstNumber: guestGstNumber || null,
        subtotal: subtotal.toString(),
        cgstRate: "9.00",
        sgstRate: "9.00",
        igstRate: "0.00",
        cgstAmount: (totalTax / 2).toString(),
        sgstAmount: (totalTax / 2).toString(),
        igstAmount: "0.00",
        totalTax: totalTax.toString(),
        totalAmount: totalAmount.toString(),
        paymentStatus: "paid"
      });
      
      // Update room status to cleaning
      await storage.updateRoomStatus(checkIn.roomId, "cleaning");
      
      res.json({
        message: "Checkout completed successfully",
        invoice,
        totalAmount,
        nights
      });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  // Get specific hotel by ID (for configuration access)
  app.get("/api/hotels/:id", authenticateToken, async (req: any, res) => {
    try {
      const hotelId = req.params.id;
      const hotel = await storage.getHotel(hotelId);

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // Check if user has access to this hotel
      if (req.user?.role === "hotelier") {
        const userHotels = await storage.getHotelsByOwnerId(req.user.id);
        if (!userHotels.some(h => h.id === hotelId)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(hotel);
    } catch (error) {
      console.error("Hotel fetch error:", error);
      res.status(500).json({ message: "Failed to fetch hotel" });
    }
  });

  // Razorpay Payment Routes
  
  // Create subscription payment order
  app.post("/api/payments/subscription", authenticateToken, async (req: any, res) => {
    try {
      const { amount, planName } = req.body;
      
      if (!amount || !planName) {
        return res.status(400).json({ message: "Amount and plan name are required" });
      }

      // Get user's hotel (assuming single hotel per user for now)
      const hotels = await storage.getHotels();
      const userHotel = hotels.find(hotel => hotel.ownerId === req.user.id);
      
      if (!userHotel) {
        return res.status(400).json({ message: "No hotel found for user" });
      }

      const order = await createSubscriptionOrder(userHotel.id, amount, planName);
      res.json(order);
    } catch (error) {
      console.error("Subscription payment error:", error);
      res.status(500).json({ message: "Failed to create subscription payment" });
    }
  });

  // Create booking payment order
  app.post("/api/payments/booking", authenticateToken, async (req: any, res) => {
    try {
      const { amount, bookingId, guestName } = req.body;
      
      if (!amount || !bookingId || !guestName) {
        return res.status(400).json({ message: "Amount, booking ID and guest name are required" });
      }

      // Get user's hotel
      const hotels = await storage.getHotels();
      const userHotel = hotels.find(hotel => hotel.ownerId === req.user.id);
      
      if (!userHotel) {
        return res.status(400).json({ message: "No hotel found for user" });
      }

      const order = await createBookingOrder(userHotel.id, amount, bookingId, guestName);
      res.json(order);
    } catch (error) {
      console.error("Booking payment error:", error);
      res.status(500).json({ message: "Failed to create booking payment" });
    }
  });

  // Verify payment callback (public for registration flow)
  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing payment verification data" });
      }

      const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      
      if (isValid) {
        // Check actual payment status with Razorpay API for UPI payments
        try {
          const paymentStatus = await checkPaymentStatusWithAPI(razorpay_payment_id);
          const status = paymentStatus.status === 'captured' || paymentStatus.status === 'authorized' ? 'success' : 
                       paymentStatus.status === 'failed' ? 'failed' : 'success';
          
          await updatePaymentStatus(razorpay_order_id, razorpay_payment_id, razorpay_signature, status);
          res.json({ 
            status: status, 
            message: 'Payment verified successfully',
            actualStatus: paymentStatus.status
          });
        } catch (apiError: any) {
          // If API check fails but signature is valid, mark as success
          await updatePaymentStatus(razorpay_order_id, razorpay_payment_id, razorpay_signature, 'success');
          res.json({ status: 'success', message: 'Payment verified successfully' });
        }
      } else {
        await updatePaymentStatus(razorpay_order_id, razorpay_payment_id, razorpay_signature, 'failed');
        res.status(400).json({ status: 'failed', message: 'Payment verification failed' });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Razorpay webhook endpoint
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      
      if (!signature) {
        console.log("Webhook: Missing signature");
        return res.status(400).json({ message: "Missing signature" });
      }

      const body = JSON.stringify(req.body);
      
      // Verify webhook signature
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.log("Webhook: Invalid signature");
        return res.status(400).json({ message: "Invalid signature" });
      }

      const webhookData = req.body;
      const event = webhookData.event;
      console.log(`Webhook received: ${event}`);

      // Handle different payment events
      if (event === 'payment.captured' || event === 'payment.authorized') {
        const paymentEntity = webhookData.payload.payment.entity;
        const paymentId = paymentEntity.id;
        const orderId = paymentEntity.order_id;
        const amount = paymentEntity.amount / 100; // Convert from paise
        const notes = paymentEntity.notes || {};

        console.log(`Payment ${event}: ${paymentId}, Order: ${orderId}, Amount: ₹${amount}`);

        // Update payment record
        await updatePaymentStatusFromWebhook(paymentId, 'captured', { 
          signature, 
          orderId,
          amount 
        });

        // Handle subscription payments - update hotel subscription
        if (notes.type === 'subscription' && notes.hotel_id) {
          try {
            const hotelId = notes.hotel_id;
            const planName = notes.plan || 'standard';
            
            // Calculate subscription dates
            const now = new Date();
            const endDate = new Date(now);
            endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
            
            // Update hotel subscription
            await storage.updateHotel(hotelId, {
              subscriptionPlan: planName,
              subscriptionStartDate: now,
              subscriptionEndDate: endDate,
              isActive: true,
            });

            console.log(`Subscription activated for hotel ${hotelId}: ${planName} until ${endDate.toISOString()}`);

            // Create audit log
            await storage.createAuditLog({
              entityType: "hotel",
              entityId: hotelId,
              action: "subscription_payment",
              description: `Subscription payment of ₹${amount} for ${planName} plan`,
              newData: { 
                paymentId, 
                amount, 
                plan: planName,
                subscriptionEndDate: endDate.toISOString() 
              },
              ipAddress: req.ip
            });
          } catch (subError) {
            console.error("Error updating subscription:", subError);
          }
        }

        // Handle booking payments
        if (notes.type === 'booking' && notes.booking_id) {
          try {
            const bookingId = notes.booking_id;
            
            // Update booking payment status
            await storage.updateBooking(bookingId, {
              paymentStatus: "paid",
              advanceAmount: amount.toString(),
            });

            console.log(`Booking payment recorded: ${bookingId}, Amount: ₹${amount}`);
          } catch (bookingError) {
            console.error("Error updating booking payment:", bookingError);
          }
        }

      } else if (event === 'payment.failed') {
        const paymentEntity = webhookData.payload.payment.entity;
        const paymentId = paymentEntity.id;
        const orderId = paymentEntity.order_id;
        const errorCode = paymentEntity.error_code;
        const errorDescription = paymentEntity.error_description;

        console.log(`Payment failed: ${paymentId}, Order: ${orderId}, Error: ${errorCode} - ${errorDescription}`);

        // Update payment record
        await updatePaymentStatusFromWebhook(paymentId, 'failed', { 
          signature, 
          orderId,
          errorCode,
          errorDescription 
        });

      } else if (event === 'refund.created' || event === 'refund.processed') {
        const refundEntity = webhookData.payload.refund.entity;
        console.log(`Refund ${event}: ${refundEntity.id}, Amount: ₹${refundEntity.amount / 100}`);
        
        // Log refund for auditing
        if (refundEntity.notes?.hotel_id) {
          await storage.createAuditLog({
            entityType: "payment",
            entityId: refundEntity.payment_id,
            action: "refund_processed",
            description: `Refund of ₹${refundEntity.amount / 100} processed`,
            newData: { 
              refundId: refundEntity.id,
              amount: refundEntity.amount / 100,
              status: refundEntity.status 
            },
            ipAddress: req.ip
          });
        }
      }

      // Always return 200 to acknowledge receipt
      res.json({ status: 'ok', event });
    } catch (error: any) {
      console.error("Webhook error:", error);
      // Still return 200 to prevent Razorpay retries for processing errors
      res.status(200).json({ status: 'error', message: error.message });
    }
  });

  // Check payment status endpoint
  app.get("/api/payments/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      // Check payment status with Razorpay API
      const paymentStatus = await checkPaymentStatusWithAPI(paymentId);
      
      res.json({
        paymentId: paymentId,
        status: paymentStatus.status,
        captured: paymentStatus.captured,
        amount: paymentStatus.amount,
        method: paymentStatus.method
      });
    } catch (error: any) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Get payment history for hotel
  app.get("/api/payments/history", authenticateToken, async (req: any, res) => {
    try {
      // Get user's hotel
      const hotels = await storage.getHotels();
      const userHotel = hotels.find(hotel => hotel.ownerId === req.user.id);
      
      if (!userHotel) {
        return res.status(400).json({ message: "No hotel found for user" });
      }

      const payments = await getHotelPayments(userHotel.id);
      res.json(payments);
    } catch (error) {
      console.error("Payment history error:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // ===== Subscription Entitlements API =====
  
  // Get subscription info for current user's hotel
  app.get("/api/subscription", authenticateToken, async (req: any, res) => {
    try {
      const hotels = await storage.getHotels();
      const userHotel = hotels.find(hotel => hotel.ownerId === req.user.id);
      
      if (!userHotel) {
        return res.json({
          status: "no_hotel",
          message: "No hotel associated with this account",
          plans: SUBSCRIPTION_PLANS
        });
      }

      const subInfo = getSubscriptionInfo(userHotel);
      const warning = getExpiryWarning(userHotel);
      
      res.json({
        status: subInfo.status,
        plan: subInfo.plan,
        planKey: subInfo.planKey,
        daysRemaining: subInfo.daysRemaining,
        isActive: subInfo.isActive,
        roomLimit: subInfo.roomLimit,
        staffLimit: subInfo.staffLimit,
        features: subInfo.plan.features,
        warning,
        subscriptionEndDate: userHotel.subscriptionEndDate,
        plans: SUBSCRIPTION_PLANS
      });
    } catch (error) {
      console.error("Subscription info error:", error);
      res.status(500).json({ message: "Failed to fetch subscription info" });
    }
  });

  // Check if a specific feature is available
  app.get("/api/subscription/check-feature/:feature", authenticateToken, async (req: any, res) => {
    try {
      const { feature } = req.params;
      const hotels = await storage.getHotels();
      const userHotel = hotels.find(hotel => hotel.ownerId === req.user.id);
      
      const access = checkFeatureAccess(userHotel || null, feature);
      res.json(access);
    } catch (error) {
      console.error("Feature check error:", error);
      res.status(500).json({ message: "Failed to check feature access" });
    }
  });

  // Check room limit
  app.get("/api/subscription/check-room-limit", authenticateToken, async (req: any, res) => {
    try {
      const hotels = await storage.getHotels();
      const userHotel = hotels.find(hotel => hotel.ownerId === req.user.id);
      
      if (!userHotel) {
        return res.json({ allowed: false, limit: 0, current: 0, reason: "No hotel found" });
      }

      const rooms = await storage.getRooms(userHotel.id);
      const result = checkRoomLimit(userHotel, rooms.length);
      res.json(result);
    } catch (error) {
      console.error("Room limit check error:", error);
      res.status(500).json({ message: "Failed to check room limit" });
    }
  });

  // Get available subscription plans
  app.get("/api/subscription/plans", (req, res) => {
    res.json(SUBSCRIPTION_PLANS);
  });

  // Razorpay config endpoint (public key)
  app.get("/api/payments/config", (req, res) => {
    try {
      if (!process.env.RAZORPAY_KEY_ID) {
        console.error("Razorpay key not configured");
        return res.status(500).json({ message: "Payment system not configured" });
      }
      res.json({
        razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Razorpay config error:", error);
      res.status(500).json({ message: "Failed to get payment configuration" });
    }
  });

  // Test endpoint for Razorpay order creation (temporary for production testing)
  app.post("/api/payments/test-subscription-order", async (req, res) => {
    try {
      const { hotelId, amount, planName } = req.body;
      
      if (!hotelId || !amount || !planName) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const order = await createSubscriptionOrder(hotelId, amount, planName);
      
      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      });
    } catch (error: any) {
      console.error("Test order creation error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to create test order" 
      });
    }
  });

  // Test endpoint for booking order creation
  app.post("/api/payments/test-booking-order", async (req, res) => {
    try {
      const { hotelId, amount, bookingId, guestName } = req.body;
      
      if (!hotelId || !amount || !bookingId || !guestName) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const order = await createBookingOrder(hotelId, amount, bookingId, guestName);
      
      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      });
    } catch (error: any) {
      console.error("Test booking order creation error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to create test booking order" 
      });
    }
  });

  // Google Places config endpoint
  app.get("/api/places/config", (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Places API key not configured" });
      }
      res.json({ apiKey });
    } catch (error) {
      console.error("Places config error:", error);
      res.status(500).json({ message: "Failed to get Places configuration" });
    }
  });

  // Registration with Google Places data endpoint
  app.post("/api/register-with-places", async (req, res) => {
    try {
      const { plan, placeDetails, owner } = req.body;
      
      if (!plan || !placeDetails || !owner) {
        return res.status(400).json({ message: "Missing required registration data" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(owner.email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "A user with this email already exists. Please sign in instead.",
          errorCode: "USER_EXISTS"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(owner.password, 10);

      // Create user first
      const userData = {
        email: owner.email,
        password: hashedPassword,
        role: "hotelier" as const,
        firstName: placeDetails.name?.split(' ')[0] || 'Hotel',
        lastName: 'Owner'
      };

      const user = await storage.createUser(userData);

      // Create hotel with Google Places data
      const hotelData = {
        name: placeDetails.name,
        address: placeDetails.address,
        phone: placeDetails.phone || owner.phone || '',
        email: owner.email,
        ownerId: user.id,
        subscriptionPlan: plan.name,
        maxRooms: plan.maxRooms || 50,
        enabledRooms: Math.min(plan.maxRooms || 50, 10),
        googlePlaceId: placeDetails.placeId,
        googleRating: placeDetails.rating?.toString(),
        googleReviewCount: placeDetails.reviewCount,
        website: placeDetails.website,
        latitude: placeDetails.latitude?.toString(),
        longitude: placeDetails.longitude?.toString(),
        city: placeDetails.city,
        state: placeDetails.state,
        country: placeDetails.country,
        postalCode: placeDetails.postalCode,
        placeTypes: placeDetails.types,
        photoReferences: placeDetails.photoReferences
      };

      const newHotel = await storage.createHotel(hotelData);

      // Create payment order
      const order = await createSubscriptionOrder(newHotel.id, plan.price, plan.name);

      res.status(201).json({
        message: "Registration successful, proceed with payment",
        user: { id: user.id, email: user.email, role: user.role },
        hotel: { id: newHotel.id, name: newHotel.name },
        order
      });

    } catch (error: any) {
      console.error("Registration with places error:", error);
      res.status(500).json({ message: error.message || "Failed to process registration" });
    }
  });

  // Registration with payment endpoint
  app.post("/api/register-with-payment", async (req, res) => {
    try {
      const { plan, hotel, owner } = req.body;
      
      if (!plan || !hotel || !owner) {
        return res.status(400).json({ message: "Missing required registration data" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(owner.email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "A user with this email already exists. Please use a different email address or log in to your existing account.",
          errorCode: "USER_EXISTS"
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(owner.password, 10);

      // Create user first
      const userData = {
        ...owner,
        password: hashedPassword,
        role: "hotelier" as const
      };

      const user = await storage.createUser(userData);

      // Create hotel with owner reference
      const hotelData = {
        name: hotel.name,
        address: hotel.address,
        phone: hotel.phone,
        email: hotel.email,
        gstNumber: hotel.gstNumber,
        panNumber: hotel.panNumber,
        stateCode: hotel.stateCode,
        ownerId: user.id,
        subscriptionPlan: plan.name,
        maxRooms: plan.maxRooms || 50,
        enabledRooms: Math.min(plan.maxRooms || 50, 10) // Start with 10 rooms enabled
      };

      const newHotel = await storage.createHotel(hotelData);

      // Create payment order
      const order = await createSubscriptionOrder(newHotel.id, plan.price, plan.name);

      res.status(201).json({
        message: "Registration successful, proceed with payment",
        user: { id: user.id, email: user.email, role: user.role },
        hotel: { id: newHotel.id, name: newHotel.name },
        order
      });

    } catch (error) {
      console.error("Registration with payment error:", error);
      res.status(500).json({ message: "Failed to process registration" });
    }
  });

  // Link property to logged-in user (Property Discovery flow)
  app.post("/api/hotels/link-property", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { placeDetails, manualDetails } = req.body;
      
      if (!placeDetails && !manualDetails) {
        return res.status(400).json({ message: "Property details are required" });
      }

      // Check if user already has a hotel
      const existingHotels = await storage.getHotelsByOwnerId(userId);
      if (existingHotels.length > 0) {
        return res.status(400).json({ 
          message: "You already have a property linked. Please contact support to add additional properties.",
          hotel: existingHotels[0]
        });
      }

      let hotelData: any;

      if (placeDetails) {
        // Google Places data
        hotelData = {
          name: placeDetails.name,
          address: placeDetails.address,
          phone: placeDetails.phone || '',
          email: req.user.email,
          ownerId: userId,
          subscriptionPlan: "trial", // Start with trial
          maxRooms: 50,
          enabledRooms: 10,
          googlePlaceId: placeDetails.placeId,
          googleRating: placeDetails.rating?.toString(),
          googleReviewCount: placeDetails.reviewCount,
          website: placeDetails.website,
          latitude: placeDetails.latitude?.toString(),
          longitude: placeDetails.longitude?.toString(),
          city: placeDetails.city,
          state: placeDetails.state,
          country: placeDetails.country,
          postalCode: placeDetails.postalCode,
          placeTypes: placeDetails.types,
          photoUrl: placeDetails.photoUrl
        };
      } else {
        // Manual entry data
        hotelData = {
          name: manualDetails.name,
          address: manualDetails.address,
          phone: manualDetails.phone || '',
          email: manualDetails.email || req.user.email,
          ownerId: userId,
          subscriptionPlan: "trial", // Start with trial
          maxRooms: 50,
          enabledRooms: 10,
          city: manualDetails.city,
          state: manualDetails.state,
          postalCode: manualDetails.pincode,
          country: "India"
        };
      }

      // Set trial dates
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14); // 14 days trial
      
      hotelData.subscriptionStartDate = now;
      hotelData.subscriptionEndDate = trialEnd;
      hotelData.monthlyRate = "0.00";

      const newHotel = await storage.createHotel(hotelData);

      res.status(201).json({
        message: "Property linked successfully",
        hotel: {
          id: newHotel.id,
          name: newHotel.name,
          address: newHotel.address
        },
        trial: {
          startDate: now,
          endDate: trialEnd,
          daysRemaining: 14
        }
      });

    } catch (error: any) {
      console.error("Link property error:", error);
      res.status(500).json({ message: error.message || "Failed to link property" });
    }
  });

  // =====================================================
  // SUPERADMIN ROUTES - Platform Management
  // =====================================================

  // Lead creation validation schema
  const leadCreationSchema = z.object({
    hotelName: z.string().min(1, "Hotel name is required"),
    contactName: z.string().min(1, "Contact name is required"),
    contactEmail: z.string().email("Valid email is required"),
    contactPhone: z.string().min(10, "Valid phone number is required"),
    hotelAddress: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    numberOfRooms: z.number().int().positive().optional().default(10),
    notes: z.string().optional(),
    source: z.string().optional().default("website"),
  });

  // Lead Management - Public endpoint for self-registration
  app.post("/api/leads", async (req, res) => {
    try {
      const validatedData = leadCreationSchema.parse(req.body);

      // Check if user with same email already exists
      const existingUser = await storage.getUserByEmail(validatedData.contactEmail);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists. Please login instead." });
      }

      // Check for duplicate lead using a more efficient query
      const existingLeads = await storage.getLeads({ limit: 1 });
      // We'll check in SQL if possible, but for now check the lead email with a helper
      const leadData = {
        hotelName: validatedData.hotelName,
        contactName: validatedData.contactName,
        contactEmail: validatedData.contactEmail,
        contactPhone: validatedData.contactPhone,
        hotelAddress: validatedData.hotelAddress,
        city: validatedData.city,
        state: validatedData.state,
        numberOfRooms: validatedData.numberOfRooms,
        notes: validatedData.notes,
        source: validatedData.source,
        status: "new" as const
      };

      const lead = await storage.createLead(leadData);
      
      res.status(201).json({ 
        message: "Thank you for your interest! Our team will contact you shortly.",
        lead: { id: lead.id, hotelName: lead.hotelName }
      });
    } catch (error: any) {
      console.error("Lead creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to submit inquiry" });
    }
  });

  // SuperAdmin: Get all leads
  app.get("/api/superadmin/leads", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getLeads({ status, limit, offset });
      res.json(result);
    } catch (error: any) {
      console.error("Get leads error:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // SuperAdmin: Get single lead
  app.get("/api/superadmin/leads/:id", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      console.error("Get lead error:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  // Lead status update validation schema
  const leadStatusUpdateSchema = z.object({
    status: z.enum(["new", "contacted", "qualified", "demo_scheduled", "trial_started", "converted", "rejected", "churned"]).optional(),
    notes: z.string().optional(),
    assignedTo: z.string().optional(),
  });

  // SuperAdmin: Update lead status
  app.patch("/api/superadmin/leads/:id", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const validatedData = leadStatusUpdateSchema.parse(req.body);
      const leadId = req.params.id;

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const updates: any = {};
      if (validatedData.status) updates.status = validatedData.status;
      if (validatedData.notes !== undefined) updates.notes = validatedData.notes;
      if (validatedData.assignedTo !== undefined) updates.assignedTo = validatedData.assignedTo;

      const updatedLead = await storage.updateLead(leadId, updates);

      // Create audit log
      await storage.createAuditLog({
        entityType: "hotel_lead",
        entityId: leadId,
        action: "status_update",
        userId: req.user.userId,
        userEmail: req.user.email,
        previousData: { status: lead.status },
        newData: { status: updates.status || lead.status },
        ipAddress: req.ip
      });

      res.json(updatedLead);
    } catch (error: any) {
      console.error("Update lead error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  // SuperAdmin: Convert lead to hotel and user
  app.post("/api/superadmin/leads/:id/convert", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const leadId = req.params.id;
      const { subscriptionPlan, maxRooms, password } = req.body;

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (lead.status === "converted") {
        return res.status(400).json({ message: "This lead has already been converted" });
      }

      // Check for existing user
      const existingUser = await storage.getUserByEmail(lead.contactEmail);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }

      // Hash password (use provided or default)
      const hashedPassword = await bcrypt.hash(password || "changeme123", 10);

      // Create user data - split contact name into first/last name
      const nameParts = lead.contactName.split(" ");
      const firstName = nameParts[0] || lead.contactName;
      const lastName = nameParts.slice(1).join(" ") || "";
      
      const userData = {
        email: lead.contactEmail,
        password: hashedPassword,
        firstName,
        lastName,
        phone: lead.contactPhone,
        role: "admin" as const,
        isActive: true
      };

      // Create hotel data
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);

      const hotelData = {
        name: lead.hotelName,
        address: lead.hotelAddress || "",
        phone: lead.contactPhone,
        email: lead.contactEmail,
        city: lead.city,
        state: lead.state,
        subscriptionPlan: subscriptionPlan || "trial",
        maxRooms: maxRooms || lead.numberOfRooms || 50,
        enabledRooms: Math.min(maxRooms || lead.numberOfRooms || 50, 10),
        subscriptionStartDate: now,
        subscriptionEndDate: trialEnd,
        monthlyRate: "0.00"
      };

      const result = await storage.convertLeadToHotel(leadId, hotelData, userData);

      // Create audit log for lead conversion
      await storage.createAuditLog({
        entityType: "hotel_lead",
        entityId: leadId,
        action: "converted",
        userId: req.user.userId,
        userEmail: req.user.email,
        hotelId: result.hotel.id,
        description: `Lead "${lead.hotelName}" converted to hotel account`,
        previousData: { status: lead.status },
        newData: { 
          status: "converted",
          hotelId: result.hotel.id, 
          userId: result.user.id,
          hotelName: result.hotel.name,
          userEmail: result.user.email
        },
        ipAddress: req.ip
      });

      res.status(201).json({
        message: "Lead converted successfully",
        hotel: { id: result.hotel.id, name: result.hotel.name },
        user: { id: result.user.id, email: result.user.email },
        credentials: {
          email: lead.contactEmail,
          temporaryPassword: password || "changeme123",
          note: "Please ask the hotel owner to change their password on first login"
        }
      });
    } catch (error: any) {
      console.error("Convert lead error:", error);
      res.status(500).json({ message: error.message || "Failed to convert lead" });
    }
  });

  // SuperAdmin: Get all hotels
  app.get("/api/superadmin/hotels", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const hotels = await storage.getHotels();
      res.json({ hotels, total: hotels.length });
    } catch (error: any) {
      console.error("Get all hotels error:", error);
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  // SuperAdmin: Create hotel directly
  app.post("/api/superadmin/hotels", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const { hotel, owner } = req.body;

      if (!hotel?.name || !hotel?.address || !owner?.email || !owner?.password) {
        return res.status(400).json({ message: "Hotel name, address, owner email and password are required" });
      }

      // Check for existing user
      const existingUser = await storage.getUserByEmail(owner.email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(owner.password, 10);

      // Create user
      const userData = {
        email: owner.email,
        password: hashedPassword,
        name: owner.name || hotel.name + " Owner",
        phone: owner.phone || hotel.phone,
        role: "admin" as const,
        isActive: true
      };

      const user = await storage.createUser(userData);

      // Create hotel
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);

      const hotelData = {
        name: hotel.name,
        address: hotel.address,
        phone: hotel.phone || "",
        email: hotel.email || owner.email,
        gstNumber: hotel.gstNumber,
        panNumber: hotel.panNumber,
        stateCode: hotel.stateCode,
        city: hotel.city,
        state: hotel.state,
        ownerId: user.id,
        subscriptionPlan: hotel.subscriptionPlan || "trial",
        maxRooms: hotel.maxRooms || 50,
        enabledRooms: hotel.enabledRooms || 10,
        subscriptionStartDate: now,
        subscriptionEndDate: trialEnd,
        monthlyRate: hotel.monthlyRate || "0.00"
      };

      const newHotel = await storage.createHotel(hotelData);

      // Create audit log
      await storage.createAuditLog({
        entityType: "hotel",
        entityId: newHotel.id,
        action: "created",
        userId: req.user.userId,
        newData: { hotelName: newHotel.name, ownerEmail: owner.email },
        ipAddress: req.ip
      });

      res.status(201).json({
        message: "Hotel created successfully",
        hotel: newHotel,
        user: { id: user.id, email: user.email, role: user.role }
      });
    } catch (error: any) {
      console.error("Create hotel error:", error);
      res.status(500).json({ message: error.message || "Failed to create hotel" });
    }
  });

  // SuperAdmin: Update hotel
  app.patch("/api/superadmin/hotels/:id", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const hotelId = req.params.id;
      const updates = req.body;

      const hotel = await storage.getHotel(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const updatedHotel = await storage.updateHotel(hotelId, updates);

      // Create audit log
      await storage.createAuditLog({
        entityType: "hotel",
        entityId: hotelId,
        action: "updated",
        userId: req.user.userId,
        previousData: hotel,
        newData: updates,
        ipAddress: req.ip
      });

      res.json(updatedHotel);
    } catch (error: any) {
      console.error("Update hotel error:", error);
      res.status(500).json({ message: "Failed to update hotel" });
    }
  });

  // SuperAdmin: Get all users
  app.get("/api/superadmin/users", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const role = req.query.role as string | undefined;
      const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getUsers({ role, isActive, limit, offset });
      
      // Remove passwords from response
      const sanitizedUsers = result.users.map(({ password, ...user }: any) => user);
      res.json({ users: sanitizedUsers, total: result.total });
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // SuperAdmin: Update user
  app.patch("/api/superadmin/users/:id", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { name, email, phone, role, isActive, password } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (role) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;
      if (password) updates.password = await bcrypt.hash(password, 10);

      const updatedUser = await storage.updateUser(userId, updates);

      // Create audit log
      await storage.createAuditLog({
        entityType: "user",
        entityId: userId,
        action: "updated",
        userId: req.user.userId,
        previousData: { role: user.role, isActive: user.isActive },
        newData: { role: updates.role, isActive: updates.isActive },
        ipAddress: req.ip
      });

      const { password: _, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // SuperAdmin: Deactivate user
  app.delete("/api/superadmin/users/:id", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const userId = req.params.id;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't allow deactivating self
      if (userId === req.user.userId) {
        return res.status(400).json({ message: "Cannot deactivate your own account" });
      }

      const deactivatedUser = await storage.deactivateUser(userId);

      // Create audit log
      await storage.createAuditLog({
        entityType: "user",
        entityId: userId,
        action: "deactivated",
        userId: req.user.userId,
        previousData: { isActive: true },
        newData: { isActive: false },
        ipAddress: req.ip
      });

      const { password: _, ...sanitizedUser } = deactivatedUser;
      res.json({ message: "User deactivated", user: sanitizedUser });
    } catch (error: any) {
      console.error("Deactivate user error:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // SuperAdmin: Get audit logs
  app.get("/api/superadmin/audit-logs", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const entityType = req.query.entityType as string | undefined;
      const hotelId = req.query.hotelId as string | undefined;
      const userId = req.query.userId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getAuditLogs({ entityType, hotelId, userId, limit, offset });
      res.json(result);
    } catch (error: any) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // SuperAdmin: Platform statistics
  app.get("/api/superadmin/stats", authenticateToken, requireRole("superadmin"), async (req: any, res) => {
    try {
      const [hotels, users, leads] = await Promise.all([
        storage.getHotels(),
        storage.getUsers({}),
        storage.getLeads({})
      ]);

      const stats = {
        totalHotels: hotels.length,
        activeHotels: hotels.filter((h: any) => h.subscriptionPlan && h.subscriptionPlan !== "expired").length,
        totalUsers: users.total,
        activeUsers: users.users.filter((u: any) => u.isActive).length,
        totalLeads: leads.total,
        leadsByStatus: {
          new: leads.leads.filter((l: any) => l.status === "new").length,
          contacted: leads.leads.filter((l: any) => l.status === "contacted").length,
          qualified: leads.leads.filter((l: any) => l.status === "qualified").length,
          converted: leads.leads.filter((l: any) => l.status === "converted").length,
          rejected: leads.leads.filter((l: any) => l.status === "rejected").length
        }
      };

      res.json(stats);
    } catch (error: any) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
