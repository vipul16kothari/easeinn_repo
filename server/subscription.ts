import type { Hotel } from "@shared/schema";

export interface SubscriptionPlan {
  name: string;
  maxRooms: number;
  maxStaff: number;
  features: string[];
  monthlyPrice: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  trial: {
    name: "Trial",
    maxRooms: 5,
    maxStaff: 1,
    features: ["basic_check_in", "basic_checkout", "basic_reports"],
    monthlyPrice: 0,
  },
  starter: {
    name: "Starter",
    maxRooms: 10,
    maxStaff: 2,
    features: [
      "basic_check_in",
      "basic_checkout",
      "basic_reports",
      "advance_booking",
      "email_notifications",
    ],
    monthlyPrice: 999,
  },
  standard: {
    name: "Standard",
    maxRooms: 25,
    maxStaff: 5,
    features: [
      "basic_check_in",
      "basic_checkout",
      "basic_reports",
      "advance_booking",
      "email_notifications",
      "gst_invoicing",
      "payment_collection",
      "analytics_dashboard",
    ],
    monthlyPrice: 2499,
  },
  professional: {
    name: "Professional",
    maxRooms: 50,
    maxStaff: 10,
    features: [
      "basic_check_in",
      "basic_checkout",
      "basic_reports",
      "advance_booking",
      "email_notifications",
      "gst_invoicing",
      "payment_collection",
      "analytics_dashboard",
      "multi_property",
      "api_access",
      "custom_reports",
      "priority_support",
    ],
    monthlyPrice: 4999,
  },
  enterprise: {
    name: "Enterprise",
    maxRooms: -1,
    maxStaff: -1,
    features: [
      "basic_check_in",
      "basic_checkout",
      "basic_reports",
      "advance_booking",
      "email_notifications",
      "gst_invoicing",
      "payment_collection",
      "analytics_dashboard",
      "multi_property",
      "api_access",
      "custom_reports",
      "priority_support",
      "white_label",
      "dedicated_support",
      "custom_integrations",
    ],
    monthlyPrice: 9999,
  },
};

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled" | "suspended";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  planKey: string;
  daysRemaining: number;
  isActive: boolean;
  canUseFeature: (feature: string) => boolean;
  roomLimit: number;
  staffLimit: number;
}

export function getSubscriptionInfo(hotel: Hotel | null): SubscriptionInfo {
  if (!hotel) {
    return {
      status: "expired",
      plan: SUBSCRIPTION_PLANS.trial,
      planKey: "trial",
      daysRemaining: 0,
      isActive: false,
      canUseFeature: () => false,
      roomLimit: 0,
      staffLimit: 0,
    };
  }

  // Respect the hotel's isActive flag first
  const hotelIsActive = hotel.isActive ?? false;
  
  // If hotel is explicitly marked inactive, deny access
  if (!hotelIsActive) {
    return {
      status: "suspended",
      plan: SUBSCRIPTION_PLANS.trial,
      planKey: "trial",
      daysRemaining: 0,
      isActive: false,
      canUseFeature: () => false,
      roomLimit: 0,
      staffLimit: 0,
    };
  }

  const planKey = hotel.subscriptionPlan || "trial";
  const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.trial;
  
  let status: SubscriptionStatus = "trial";
  let daysRemaining = 0;
  let isActive = true;

  // Handle subscription end date
  if (hotel.subscriptionEndDate) {
    const endDate = new Date(hotel.subscriptionEndDate);
    const now = new Date();
    daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining > 0) {
      status = planKey === "trial" ? "trial" : "active";
    } else {
      status = "expired";
      isActive = false;
    }
  } else if (hotel.subscriptionPlan && hotel.subscriptionPlan !== "trial") {
    // Paid plan without end date - check subscription start date
    if (hotel.subscriptionStartDate) {
      const startDate = new Date(hotel.subscriptionStartDate);
      const now = new Date();
      // Assume 30 days from start if no end date
      const assumedEndDate = new Date(startDate);
      assumedEndDate.setDate(assumedEndDate.getDate() + 30);
      daysRemaining = Math.ceil((assumedEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 0) {
        status = "active";
      } else {
        status = "expired";
        isActive = false;
      }
    } else {
      // No dates at all but has plan - mark as expired (needs renewal)
      status = "expired";
      isActive = false;
      daysRemaining = 0;
    }
  } else {
    // Trial plan - give 14 day grace period from hotel creation
    status = "trial";
    daysRemaining = 14; // Default trial period
    isActive = true;
  }

  const canUseFeature = (feature: string): boolean => {
    if (!isActive) return false;
    return plan.features.includes(feature);
  };

  return {
    status,
    plan,
    planKey,
    daysRemaining,
    isActive,
    canUseFeature,
    roomLimit: plan.maxRooms,
    staffLimit: plan.maxStaff,
  };
}

export function checkFeatureAccess(
  hotel: Hotel | null,
  requiredFeature: string
): { allowed: boolean; reason?: string } {
  const subInfo = getSubscriptionInfo(hotel);
  
  if (!subInfo.isActive) {
    return {
      allowed: false,
      reason: subInfo.status === "expired" 
        ? "Your subscription has expired. Please renew to continue using this feature."
        : "Your account is not active. Please contact support.",
    };
  }

  if (!subInfo.canUseFeature(requiredFeature)) {
    return {
      allowed: false,
      reason: `This feature requires a ${getMinimumPlanForFeature(requiredFeature)} plan or higher. Please upgrade your subscription.`,
    };
  }

  return { allowed: true };
}

export function getMinimumPlanForFeature(feature: string): string {
  for (const [planKey, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.features.includes(feature)) {
      return plan.name;
    }
  }
  return "Enterprise";
}

export function checkRoomLimit(hotel: Hotel | null, currentRoomCount: number): { 
  allowed: boolean; 
  limit: number; 
  current: number;
  reason?: string 
} {
  const subInfo = getSubscriptionInfo(hotel);
  
  if (subInfo.roomLimit === -1) {
    return { allowed: true, limit: -1, current: currentRoomCount };
  }
  
  if (currentRoomCount >= subInfo.roomLimit) {
    return {
      allowed: false,
      limit: subInfo.roomLimit,
      current: currentRoomCount,
      reason: `Room limit reached (${currentRoomCount}/${subInfo.roomLimit}). Please upgrade your subscription to add more rooms.`,
    };
  }

  return { allowed: true, limit: subInfo.roomLimit, current: currentRoomCount };
}

export function checkStaffLimit(hotel: Hotel | null, currentStaffCount: number): {
  allowed: boolean;
  limit: number;
  current: number;
  reason?: string;
} {
  const subInfo = getSubscriptionInfo(hotel);
  
  if (subInfo.staffLimit === -1) {
    return { allowed: true, limit: -1, current: currentStaffCount };
  }
  
  if (currentStaffCount >= subInfo.staffLimit) {
    return {
      allowed: false,
      limit: subInfo.staffLimit,
      current: currentStaffCount,
      reason: `Staff limit reached (${currentStaffCount}/${subInfo.staffLimit}). Please upgrade your subscription to add more staff members.`,
    };
  }

  return { allowed: true, limit: subInfo.staffLimit, current: currentStaffCount };
}

export function getExpiryWarning(hotel: Hotel | null): string | null {
  const subInfo = getSubscriptionInfo(hotel);
  
  if (subInfo.status === "expired") {
    return "Your subscription has expired. Some features may be unavailable.";
  }
  
  if (subInfo.daysRemaining <= 7 && subInfo.daysRemaining > 0) {
    return `Your subscription expires in ${subInfo.daysRemaining} day${subInfo.daysRemaining === 1 ? '' : 's'}. Please renew soon.`;
  }
  
  return null;
}
