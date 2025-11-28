import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  Crown, 
  Sparkles, 
  CheckCircle,
  Clock,
  ArrowRight,
  Zap
} from "lucide-react";

interface PaymentNudgeProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  action?: string;
}

export default function PaymentNudge({ isOpen, onClose, feature = "this feature", action = "update" }: PaymentNudgeProps) {
  const [, setLocation] = useLocation();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  }) as { data: { user: any; hotel: any; trialStatus?: any } | undefined };

  const hotel = authData?.hotel;
  const trialStatus = authData?.trialStatus;
  
  const isOnTrial = hotel?.subscriptionPlan === "trial";
  const trialDaysRemaining = trialStatus?.daysRemaining || 0;

  const handleUpgrade = () => {
    onClose();
    setLocation("/payments");
  };

  const handleContinueTrial = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="payment-nudge-dialog">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 w-fit">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {isOnTrial ? "Upgrade to Continue" : "Subscription Required"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isOnTrial 
              ? `You're on a free trial. Upgrade to ${action} ${feature} without limits.`
              : `Subscribe to ${action} ${feature} and unlock all features.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isOnTrial && trialDaysRemaining > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {trialDaysRemaining} days remaining in your trial
              </span>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">Premium Benefits</span>
            </div>
            <ul className="space-y-2">
              {[
                "Unlimited room management",
                "GST-compliant invoicing",
                "Advanced booking features",
                "Detailed analytics & reports",
                "Priority customer support"
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleUpgrade}
              className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-upgrade-now"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              View Plans & Upgrade
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            {isOnTrial && trialDaysRemaining > 0 && (
              <Button 
                variant="outline"
                onClick={handleContinueTrial}
                className="w-full"
                data-testid="button-continue-trial"
              >
                Continue with Trial
              </Button>
            )}
          </div>

          {isOnTrial && (
            <p className="text-center text-xs text-gray-500">
              During trial, some features may be limited. Upgrade anytime for full access.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function usePaymentNudge() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState({ feature: "", action: "" });

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  }) as { data: { user: any; hotel: any; trialStatus?: any } | undefined };

  const hotel = authData?.hotel;
  const isOnTrial = hotel?.subscriptionPlan === "trial";
  const hasExpiredTrial = authData?.trialStatus?.isExpired;
  const isPaidUser = hotel?.subscriptionPlan && hotel.subscriptionPlan !== "trial";

  const checkAndNudge = (feature: string, action: string = "update"): boolean => {
    if (isPaidUser) {
      return true;
    }
    
    if (hasExpiredTrial) {
      setContext({ feature, action });
      setIsOpen(true);
      return false;
    }
    
    return true;
  };

  const openNudge = (feature: string, action: string = "update") => {
    setContext({ feature, action });
    setIsOpen(true);
  };

  const closeNudge = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    context,
    checkAndNudge,
    openNudge,
    closeNudge,
    isOnTrial,
    isPaidUser,
    hasExpiredTrial
  };
}
