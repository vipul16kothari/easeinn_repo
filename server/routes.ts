import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGuestSchema, insertCheckInSchema, insertRoomSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
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
        checkOutTime: z.string()
      });
      
      // Validate data
      const validatedGuest = insertGuestSchema.parse(guestData);
      const validatedCheckIn = checkInValidationSchema.parse(checkInData);
      
      // Create guest first
      const guest = await storage.createGuest(validatedGuest);
      
      // Create check-in with the new guest ID
      const checkIn = await storage.createCheckIn({
        ...validatedCheckIn,
        guestId: guest.id
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

  const httpServer = createServer(app);
  return httpServer;
}
