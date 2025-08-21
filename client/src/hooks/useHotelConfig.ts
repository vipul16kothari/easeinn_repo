import { useAuth } from "./useAuth";

export function useHotelConfig() {
  const { hotel, isLoading } = useAuth();
  
  return {
    hotel,
    isLoading,
    config: {
      maxRooms: hotel?.maxRooms || 50,
      enabledRooms: hotel?.enabledRooms || 10,
      roomTypes: hotel?.roomTypes || ["standard", "deluxe", "suite"],
      features: hotel?.features || ["wifi", "ac", "tv", "parking"],
      policies: hotel?.policies || {
        checkInTime: "14:00",
        checkOutTime: "11:00",
        cancellationPolicy: "24 hours",
        petPolicy: false,
        smokingPolicy: false,
      },
      pricing: hotel?.pricing || {
        baseRate: 2000,
        weekendSurcharge: 500,
        seasonalRates: {},
        taxRate: 18,
      },
      settings: hotel?.settings || {
        allowAdvanceBooking: true,
        advanceBookingDays: 90,
        requireApproval: false,
        autoConfirm: true,
        enablePayments: true,
        currency: "INR",
      },
    },
  };
}