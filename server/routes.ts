import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { setupAuthRoutes, authenticateToken, requireRole } from "./auth";
import { insertGuestSchema, insertCheckInSchema, insertRoomSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware
  app.use(cookieParser());
  
  // Authentication routes
  setupAuthRoutes(app);
  
  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/available", async (req, res) => {
    try {
      const rooms = await storage.getAvailableRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available rooms" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
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
  app.get("/api/guests", async (req, res) => {
    try {
      const search = req.query.search as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getGuests(search, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guests" });
    }
  });

  app.get("/api/guests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const guest = await storage.getGuest(id);
      
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
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
  app.get("/api/checkins", async (req, res) => {
    try {
      const checkIns = await storage.getCheckIns();
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  app.get("/api/checkins/active", async (req, res) => {
    try {
      const activeCheckIns = await storage.getActiveCheckIns();
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
  app.get("/api/statistics/rooms", async (req, res) => {
    try {
      const stats = await storage.getRoomStatistics();
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
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      // Add hotelId from first available hotel if missing (single-property setup)
      let bookingData = { ...req.body };
      if (!bookingData.hotelId) {
        const hotels = await storage.getHotels();
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
  app.post("/api/bookings/multi-room", async (req, res) => {
    try {
      const { guestName, guestPhone, guestEmail, checkInDate, checkOutDate, advanceAmount, totalAmount, specialRequests, rooms } = req.body;

      // Add hotelId from first available hotel if missing (single-property setup)
      const hotels = await storage.getHotels();
      if (hotels.length === 0) {
        return res.status(400).json({ message: "No hotels found. Please create a hotel first." });
      }

      const bookingData = {
        hotelId: hotels[0].id,
        guestName,
        guestPhone,
        guestEmail: guestEmail || null,
        roomType: "deluxe", // Default value to satisfy NOT NULL constraint, actual room types in booking_rooms table
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

  app.get("/api/calendar/events", async (req, res) => {
    try {
      const { start, end } = req.query;
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      // Get both active check-ins and confirmed bookings for the date range
      const [activeCheckIns, bookings] = await Promise.all([
        storage.getActiveCheckIns(),
        storage.getBookingsByDateRange(startDate, endDate)
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

  const httpServer = createServer(app);
  return httpServer;
}
