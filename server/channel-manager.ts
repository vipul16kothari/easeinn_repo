import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { authenticateToken, requireHotelOwner, checkTrialExpiration } from "./auth";
import { z } from "zod";
import { insertOtaChannelSchema, insertChannelRatePlanSchema, insertChannelInventorySchema, insertChannelRoomMappingSchema } from "@shared/schema";

// Channel sync service class
export class ChannelSyncService {
  private static supportedChannels = [
    { id: "booking_com", name: "Booking.com", endpoint: "https://distribution-xml.booking.com", commission: 15 },
    { id: "makemytrip", name: "MakeMyTrip", endpoint: "https://partners.makemytrip.com/api", commission: 18 },
    { id: "agoda", name: "Agoda", endpoint: "https://affiliates.agoda.com/xmlapi", commission: 16 },
    { id: "expedia", name: "Expedia", endpoint: "https://www.expediaconnectivity.com/eqc", commission: 15 },
    { id: "goibibo", name: "Goibibo", endpoint: "https://partners.goibibo.com/api", commission: 20 },
    { id: "cleartrip", name: "Cleartrip", endpoint: "https://partners.cleartrip.com/api", commission: 17 },
    { id: "traveloka", name: "Traveloka", endpoint: "https://affiliates.traveloka.com/api", commission: 18 },
    { id: "airbnb", name: "Airbnb", endpoint: "https://api.airbnb.com/v3", commission: 3 },
  ];

  static getSupportedChannels() {
    return this.supportedChannels;
  }

  // Sync inventory to a specific channel
  static async syncInventoryToChannel(channelId: string, inventoryData: any[]) {
    try {
      const channel = await storage.getOtaChannel(channelId);
      if (!channel || channel.status !== "active") {
        throw new Error("Channel not active or not found");
      }

      // Log sync attempt
      const syncLog = await storage.createChannelSyncLog({
        hotelId: channel.hotelId,
        channelId: channelId,
        syncType: "inventory",
        direction: "push",
        status: "pending",
        startedAt: new Date(),
        requestPayload: inventoryData,
      });

      // Simulate API call to OTA (replace with actual API integration)
      const response = await this.mockOtaApiCall(channel.apiEndpoint, {
        type: "inventory_update",
        propertyId: channel.propertyId,
        data: inventoryData,
      });

      // Update sync log
      await storage.updateChannelSyncLog(syncLog.id, {
        status: response.success ? "success" : "failed",
        responseData: response,
        completedAt: new Date(),
        recordsProcessed: inventoryData.length,
        recordsSuccessful: response.success ? inventoryData.length : 0,
        recordsFailed: response.success ? 0 : inventoryData.length,
        errorMessage: response.error || null,
      });

      return response;
    } catch (error) {
      console.error("Channel sync error:", error);
      throw error;
    }
  }

  // Mock OTA API call (replace with real integrations)
  private static async mockOtaApiCall(endpoint: string, payload: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful response (90% success rate)
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        message: "Inventory updated successfully",
        timestamp: new Date().toISOString(),
        recordsUpdated: payload.data?.length || 0,
      };
    } else {
      return {
        success: false,
        error: "OTA API temporarily unavailable",
        errorCode: "TEMP_UNAVAILABLE",
        retryAfter: 300, // 5 minutes
      };
    }
  }

  // Generate inventory data for date range
  static async generateInventoryForDateRange(hotelId: string, startDate: Date, endDate: Date) {
    const rooms = await storage.getRoomsByHotelId(hotelId);
    const channels = await storage.getActiveChannelsByHotelId(hotelId);
    
    const inventoryUpdates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      for (const channel of channels) {
        for (const roomType of ["standard", "deluxe", "suite"] as const) {
          const roomsOfType = rooms.filter(r => r.type === roomType);
          
          if (roomsOfType.length > 0) {
            const ratePlan = await storage.getChannelRatePlanByChannelAndRoomType(channel.id, roomType);
            
            if (ratePlan) {
              inventoryUpdates.push({
                channelId: channel.id,
                ratePlanId: ratePlan.id,
                roomType,
                date: new Date(currentDate),
                totalRooms: roomsOfType.length,
                availableRooms: Math.max(0, roomsOfType.length - (channel.settings.inventoryBuffer || 0)),
                sellRate: this.calculateDynamicRate(ratePlan, currentDate),
              });
            }
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return inventoryUpdates;
  }

  // Calculate dynamic pricing based on date and rate plan
  private static calculateDynamicRate(ratePlan: any, date: Date): number {
    let baseRate = parseFloat(ratePlan.baseRate);
    
    // Weekend surcharge (Friday, Saturday)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      baseRate += parseFloat(ratePlan.weekendSurcharge || "0");
    }
    
    // Apply seasonal rates if any
    const dateStr = date.toISOString().split('T')[0];
    for (const [dateRange, rateInfo] of Object.entries(ratePlan.seasonalRates || {})) {
      const [start, end] = dateRange.split('_');
      if (dateStr >= start && dateStr <= end) {
        baseRate = (rateInfo as any).rate;
        break;
      }
    }
    
    // Apply discount/markup percentage
    const discountPercent = parseFloat(ratePlan.discountPercentage || "0");
    baseRate = baseRate * (1 + discountPercent / 100);
    
    return Math.round(baseRate * 100) / 100; // Round to 2 decimal places
  }

  // Bulk sync all channels for a hotel
  static async syncAllChannels(hotelId: string) {
    const channels = await storage.getActiveChannelsByHotelId(hotelId);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365); // 1 year ahead
    
    const inventoryData = await this.generateInventoryForDateRange(hotelId, startDate, endDate);
    
    const results = [];
    for (const channel of channels) {
      if (channel.settings.autoSync) {
        const channelInventory = inventoryData.filter(inv => inv.channelId === channel.id);
        const result = await this.syncInventoryToChannel(channel.id, channelInventory);
        results.push({ channelId: channel.id, result });
      }
    }
    
    return results;
  }
}

export function setupChannelManagerRoutes(app: Express) {
  // Get supported OTA channels
  app.get("/api/channel-manager/supported-channels", authenticateToken, checkTrialExpiration, async (req: any, res: Response) => {
    try {
      const supportedChannels = ChannelSyncService.getSupportedChannels();
      res.json(supportedChannels);
    } catch (error) {
      console.error("Error fetching supported channels:", error);
      res.status(500).json({ message: "Failed to fetch supported channels" });
    }
  });

  // Get hotel's connected channels
  app.get("/api/channel-manager/channels", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const hotelId = req.headers['x-hotel-id'];
      if (!hotelId) {
        return res.status(400).json({ message: "Hotel ID required" });
      }

      const channels = await storage.getChannelsByHotelId(hotelId);
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  // Create new OTA channel connection
  app.post("/api/channel-manager/channels", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const hotelId = req.headers['x-hotel-id'];
      if (!hotelId) {
        return res.status(400).json({ message: "Hotel ID required" });
      }

      const channelData = insertOtaChannelSchema.parse({ ...req.body, hotelId });
      const channel = await storage.createOtaChannel(channelData);
      
      res.status(201).json(channel);
    } catch (error) {
      console.error("Error creating channel:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create channel" });
    }
  });

  // Update channel configuration
  app.put("/api/channel-manager/channels/:channelId", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const { channelId } = req.params;
      const updates = req.body;
      
      const channel = await storage.updateOtaChannel(channelId, updates);
      res.json(channel);
    } catch (error) {
      console.error("Error updating channel:", error);
      res.status(500).json({ message: "Failed to update channel" });
    }
  });

  // Delete channel
  app.delete("/api/channel-manager/channels/:channelId", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const { channelId } = req.params;
      await storage.deleteOtaChannel(channelId);
      res.json({ message: "Channel deleted successfully" });
    } catch (error) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ message: "Failed to delete channel" });
    }
  });

  // Get channel rate plans
  app.get("/api/channel-manager/channels/:channelId/rate-plans", authenticateToken, checkTrialExpiration, async (req: any, res: Response) => {
    try {
      const { channelId } = req.params;
      const ratePlans = await storage.getChannelRatePlansByChannelId(channelId);
      res.json(ratePlans);
    } catch (error) {
      console.error("Error fetching rate plans:", error);
      res.status(500).json({ message: "Failed to fetch rate plans" });
    }
  });

  // Create rate plan
  app.post("/api/channel-manager/channels/:channelId/rate-plans", authenticateToken, checkTrialExpiration, async (req: any, res: Response) => {
    try {
      const { channelId } = req.params;
      const ratePlanData = insertChannelRatePlanSchema.parse({ ...req.body, channelId });
      const ratePlan = await storage.createChannelRatePlan(ratePlanData);
      res.status(201).json(ratePlan);
    } catch (error) {
      console.error("Error creating rate plan:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create rate plan" });
    }
  });

  // Update inventory and sync to all channels
  app.post("/api/channel-manager/sync-inventory", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const hotelId = req.headers['x-hotel-id'];
      if (!hotelId) {
        return res.status(400).json({ message: "Hotel ID required" });
      }

      const { startDate, endDate } = req.body;
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

      const results = await ChannelSyncService.syncAllChannels(hotelId);
      
      res.json({
        message: "Inventory sync initiated",
        results,
        syncedChannels: results.length,
      });
    } catch (error) {
      console.error("Error syncing inventory:", error);
      res.status(500).json({ message: "Failed to sync inventory" });
    }
  });

  // Get sync logs
  app.get("/api/channel-manager/sync-logs", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const hotelId = req.headers['x-hotel-id'];
      if (!hotelId) {
        return res.status(400).json({ message: "Hotel ID required" });
      }

      const { limit = 50, offset = 0 } = req.query;
      const logs = await storage.getChannelSyncLogs(hotelId, parseInt(limit as string), parseInt(offset as string));
      
      res.json(logs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ message: "Failed to fetch sync logs" });
    }
  });

  // Get channel bookings
  app.get("/api/channel-manager/bookings", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const hotelId = req.headers['x-hotel-id'];
      if (!hotelId) {
        return res.status(400).json({ message: "Hotel ID required" });
      }

      const { channelId, status, limit = 100, offset = 0 } = req.query;
      const bookings = await storage.getChannelBookings(hotelId, {
        channelId: channelId as string,
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching channel bookings:", error);
      res.status(500).json({ message: "Failed to fetch channel bookings" });
    }
  });

  // Manual sync specific channel
  app.post("/api/channel-manager/channels/:channelId/sync", authenticateToken, checkTrialExpiration, async (req: any, res: Response) => {
    try {
      const { channelId } = req.params;
      const { startDate, endDate } = req.body;
      
      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const channel = await storage.getOtaChannel(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      
      const inventoryData = await ChannelSyncService.generateInventoryForDateRange(channel.hotelId, start, end);
      const channelInventory = inventoryData.filter(inv => inv.channelId === channelId);
      
      const result = await ChannelSyncService.syncInventoryToChannel(channelId, channelInventory);
      
      res.json({
        message: "Channel sync completed",
        channelName: channel.displayName,
        result,
        recordsSynced: channelInventory.length,
      });
    } catch (error) {
      console.error("Error syncing channel:", error);
      res.status(500).json({ message: "Failed to sync channel" });
    }
  });

  // Get channel analytics
  app.get("/api/channel-manager/analytics", authenticateToken, checkTrialExpiration, requireHotelOwner, async (req: any, res: Response) => {
    try {
      const hotelId = req.headers['x-hotel-id'];
      if (!hotelId) {
        return res.status(400).json({ message: "Hotel ID required" });
      }

      const analytics = await storage.getChannelAnalytics(hotelId);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
}