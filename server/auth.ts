import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = "7d";

// Registration schema for combined user + hotel creation
const registrationSchema = z.object({
  // User fields
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  
  // Hotel fields
  hotelName: z.string().min(1),
  hotelAddress: z.string().min(1),
  hotelPhone: z.string().min(10),
  hotelEmail: z.string().email(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  stateCode: z.string().length(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["superadmin", "admin", "hotelier"]),
});

export function setupAuthRoutes(app: Express) {
  // Regular registration (no trial)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = registrationSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      
      // Create user
      const userData = {
        email: validatedData.email,
        password: hashedPassword,
        role: "hotelier" as const,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      };
      
      const user = await storage.createUser(userData);
      
      // Create hotel (no subscription initially)
      const hotelData = {
        name: validatedData.hotelName,
        address: validatedData.hotelAddress,
        phone: validatedData.hotelPhone,
        email: validatedData.hotelEmail,
        gstNumber: validatedData.gstNumber || null,
        panNumber: validatedData.panNumber || null,
        stateCode: validatedData.stateCode,
        ownerId: user.id,
        subscriptionPlan: null, // No subscription initially
        subscriptionStartDate: null,
        subscriptionEndDate: null,
      };
      
      const hotel = await storage.createHotel(hotelData);
      
      res.status(201).json({
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        hotel: {
          id: hotel.id,
          name: hotel.name,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Trial registration (14-day free trial)
  app.post("/api/auth/register-trial", async (req: Request, res: Response) => {
    try {
      const validatedData = registrationSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      
      // Create user
      const userData = {
        email: validatedData.email,
        password: hashedPassword,
        role: "hotelier" as const,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      };
      
      const user = await storage.createUser(userData);
      
      // Create hotel with 14-day trial
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14); // 14 days from now
      
      const hotelData = {
        name: validatedData.hotelName,
        address: validatedData.hotelAddress,
        phone: validatedData.hotelPhone,
        email: validatedData.hotelEmail,
        gstNumber: validatedData.gstNumber || null,
        panNumber: validatedData.panNumber || null,
        stateCode: validatedData.stateCode,
        ownerId: user.id,
        subscriptionPlan: "trial",
        subscriptionStartDate: now,
        subscriptionEndDate: trialEnd,
        monthlyRate: "0.00", // Trial is free
      };
      
      const hotel = await storage.createHotel(hotelData);
      
      res.status(201).json({
        message: "Trial registration successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        hotel: {
          id: hotel.id,
          name: hotel.name,
        },
        trial: {
          startDate: now,
          endDate: trialEnd,
          daysRemaining: 14,
        },
      });
    } catch (error) {
      console.error("Trial registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Trial registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, role } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check role
      if (user.role !== role) {
        return res.status(401).json({ 
          message: `Invalid credentials for ${role} access` 
        });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      // Set HTTP-only cookie with production security
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: isProduction, // Only secure in production
        sameSite: isProduction ? "strict" : "lax", // Strict in prod, lax in dev
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });
      
      // Get user's hotel(s) if hotelier
      let hotels: any[] = [];
      if (user.role === "hotelier") {
        hotels = await storage.getHotelsByOwnerId(user.id);
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        hotels,
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("authToken");
    res.json({ message: "Logged out successfully" });
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let hotels: any[] = [];
      let trialStatus = null;
      
      if (user.role === "hotelier") {
        hotels = await storage.getHotelsByOwnerId(user.id);
        
        // Check trial status for first hotel
        if (hotels.length > 0 && hotels[0].subscriptionPlan === "trial") {
          const hotel = hotels[0];
          const now = new Date();
          const endDate = new Date(hotel.subscriptionEndDate);
          
          if (endDate) {
            const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isExpired = now > endDate;
            
            trialStatus = {
              isTrialUser: true,
              isExpired,
              daysRemaining: Math.max(0, daysRemaining),
              endDate: endDate.toISOString(),
            };
          }
        }
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        hotel: hotels.length > 0 ? hotels[0] : null,
        hotels,
        trialStatus,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}

// Authentication middleware
export function authenticateToken(req: any, res: Response, next: NextFunction) {
  const token = req.cookies?.authToken;
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Debug logging only in development
  if (isDev) {
    console.log(`[Auth] ${req.method} ${req.path} - token: ${token ? 'present' : 'missing'}`);
  }
  
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (isDev) {
      console.error(`[Auth] Token verification failed: ${error.message}`);
    }
    res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Middleware to check if hotel is active for hotelier users
export function requireActiveHotel(storage: any) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // Skip check for admin users
      if (req.user?.role === "admin") {
        return next();
      }

      // For hoteliers, check if their hotel is active
      if (req.user?.role === "hotelier") {
        const hotel = await storage.getHotelByOwnerId(req.user.id);
        
        if (!hotel) {
          console.log(`No hotel found for hotelier user ID: ${req.user.id}`);
          res.clearCookie("authToken");
          return res.status(403).json({ 
            message: "Hotel not found", 
            logout: true 
          });
        }

        if (!hotel.isActive) {
          console.log(`Hotel ${hotel.name} (ID: ${hotel.id}) is deactivated. Logging out user ${req.user.id}`);
          res.clearCookie("authToken");
          return res.status(403).json({ 
            message: "Hotel account has been deactivated", 
            logout: true 
          });
        }

        // Store hotel info in request for use in other middleware/routes
        req.hotel = hotel;
      }

      next();
    } catch (error) {
      console.error("Hotel active check error:", error);
      res.status(500).json({ message: "Failed to verify hotel status" });
    }
  };
}

// Role-based authorization middleware
export function requireRole(roles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(" or ")}` 
      });
    }
    
    next();
  };
}

// Hotel owner authorization middleware
export function requireHotelOwner(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Admin can access any hotel, hotelier can only access their own
  if (req.user.role === "admin") {
    return next();
  }
  
  if (req.user.role !== "hotelier") {
    return res.status(403).json({ message: "Access denied" });
  }
  
  // For hotelier, we'll verify hotel ownership in the route handler
  next();
}

// Trial expiration middleware
export function checkTrialExpiration(req: any, res: Response, next: NextFunction) {
  // Skip trial check for non-authenticated routes
  if (!req.user) {
    return next();
  }
  
  // Admin users bypass trial checks
  if (req.user.role === "admin") {
    return next();
  }
  
  // Only check for hoteliers
  if (req.user.role !== "hotelier") {
    return next();
  }
  
  // Get user's hotel and check trial status
  storage.getHotelsByOwnerId(req.user.userId).then((hotels) => {
    if (hotels.length === 0) {
      return next();
    }
    
    const hotel = hotels[0];
    
    // Only check trial users
    if (hotel.subscriptionPlan === "trial" && hotel.subscriptionEndDate) {
      const now = new Date();
      const endDate = new Date(hotel.subscriptionEndDate);
      
      if (now > endDate) {
        // Trial expired - allow only payments and auth routes
        const allowedPaths = ['/api/auth/', '/api/payments/', '/api/logout'];
        const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
        
        if (!isAllowedPath) {
          return res.status(402).json({ 
            message: "Trial period expired. Please upgrade your subscription to continue.",
            trialExpired: true,
            endDate: endDate.toISOString()
          });
        }
      }
    }
    
    next();
  }).catch((error) => {
    console.error("Trial check error:", error);
    next();
  });
}