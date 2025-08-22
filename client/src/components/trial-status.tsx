import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Clock, CreditCard, AlertTriangle } from "lucide-react";

export default function TrialStatus() {
  const { trialStatus, isAuthenticated } = useAuth();

  if (!isAuthenticated || !trialStatus?.isTrialUser) {
    return null;
  }

  const { isExpired, daysRemaining } = trialStatus;

  if (isExpired) {
    return (
      <Card className="bg-red-50 border-red-200 mb-6" data-testid="card-trial-expired">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900">Trial Expired</h3>
                <p className="text-sm text-red-700">
                  Your 14-day trial has ended. Upgrade now to continue using EaseInn.
                </p>
              </div>
            </div>
            <Link href="/signup">
              <Button className="bg-red-600 hover:bg-red-700 text-white" data-testid="button-upgrade-now">
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const badgeColor = daysRemaining <= 3 ? "destructive" : daysRemaining <= 7 ? "secondary" : "default";

  return (
    <Card className="bg-blue-50 border-blue-200 mb-6" data-testid="card-trial-active">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-blue-900">Free Trial Active</h3>
                <Badge variant={badgeColor} data-testid="badge-days-remaining">
                  {daysRemaining} days left
                </Badge>
              </div>
              <p className="text-sm text-blue-700">
                Enjoying EaseInn? Upgrade before your trial expires to keep your data.
              </p>
            </div>
          </div>
          <Link href="/signup">
            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100" data-testid="button-upgrade-early">
              <CreditCard className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}