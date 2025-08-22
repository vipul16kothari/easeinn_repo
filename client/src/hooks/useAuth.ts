import { useQuery } from "@tanstack/react-query";
import { User, Hotel } from "@shared/schema";

interface TrialStatus {
  isTrialUser: boolean;
  isExpired: boolean;
  daysRemaining: number;
  endDate: string;
}

interface AuthResponse {
  user: User;
  hotel: Hotel | null;
  hotels: Hotel[];
  trialStatus: TrialStatus | null;
}

export function useAuth() {
  const { data, isLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user: data?.user,
    hotel: data?.hotel, // Current user's hotel with full config
    hotels: data?.hotels || [],
    trialStatus: data?.trialStatus || null,
    isLoading,
    isAuthenticated: !!data?.user,
  };
}