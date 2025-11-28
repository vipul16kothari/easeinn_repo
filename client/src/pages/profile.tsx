import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHotelConfig } from "@/hooks/useHotelConfig";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Hotel, 
  CreditCard, 
  Calendar, 
  Settings, 
  Crown,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

export default function ProfilePage() {
  const { user, hotel } = useAuth();
  const { config } = useHotelConfig();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    document.title = "Profile Settings - EaseInn Hotel Platform";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Manage your hotel profile, subscription details, and account settings with EaseInn comprehensive hotel management platform.');
    }
  }, []);

  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string }) => {
      const response = await apiRequest("PATCH", "/api/auth/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast({
        title: "Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(editForm);
  };

  const getSubscriptionStatus = () => {
    if (!hotel?.subscriptionEndDate) return { status: 'trial', color: 'blue', icon: Clock };
    
    const endDate = new Date(hotel.subscriptionEndDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft > 30) return { status: 'active', color: 'green', icon: CheckCircle };
    if (daysLeft > 0) return { status: 'expiring', color: 'yellow', icon: AlertCircle };
    return { status: 'expired', color: 'red', icon: AlertCircle };
  };

  const subscriptionInfo = getSubscriptionStatus();
  const StatusIcon = subscriptionInfo.icon;

  if (!user || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account, hotel details, and subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-medium">
                  {user.firstName && user.lastName 
                    ? `${user.firstName[0]}${user.lastName[0]}` 
                    : user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user.email || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Role</label>
                <Badge variant="outline" className="ml-0">
                  {user.role === 'hotelier' ? 'Hotel Manager' : 'Staff'}
                </Badge>
              </div>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsEditDialogOpen(true)}
                data-testid="button-edit-profile"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Hotel Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5" />
                Hotel Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Hotel Name</label>
                  <p className="text-gray-900 font-medium">{hotel.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{hotel.phone || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{hotel.email || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">GST Number</label>
                  <p className="text-gray-900">{hotel.gstNumber || 'Not set'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900">{hotel.address || 'Not set'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Rooms</label>
                  <p className="text-gray-900 font-medium">{config.maxRooms || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Enabled Rooms</label>
                  <p className="text-gray-900 font-medium">{config.enabledRooms || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">State Code</label>
                  <p className="text-gray-900">{hotel.stateCode || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <StatusIcon className={`h-6 w-6 text-${subscriptionInfo.color}-600`} />
                    <div>
                      <p className="font-medium text-gray-900">Current Plan</p>
                      <Badge 
                        variant={subscriptionInfo.status === 'active' ? 'default' : 'secondary'}
                        className={`text-${subscriptionInfo.color}-700 bg-${subscriptionInfo.color}-50 border-${subscriptionInfo.color}-200`}
                      >
                        {hotel.subscriptionPlan ? hotel.subscriptionPlan.charAt(0).toUpperCase() + hotel.subscriptionPlan.slice(1) : 'Trial'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {subscriptionInfo.status === 'trial' && 'You are on a 14-day free trial.'}
                    {subscriptionInfo.status === 'active' && 'Your subscription is active.'}
                    {subscriptionInfo.status === 'expiring' && 'Your subscription is expiring soon.'}
                    {subscriptionInfo.status === 'expired' && 'Your subscription has expired.'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Start Date</span>
                  </div>
                  <p className="text-gray-900">
                    {hotel.subscriptionStartDate 
                      ? new Date(hotel.subscriptionStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Not set'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">End Date</span>
                  </div>
                  <p className="text-gray-900">
                    {hotel.subscriptionEndDate 
                      ? new Date(hotel.subscriptionEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Not set'}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Upgrade Your Plan</p>
                  <p className="text-sm text-gray-600">Get access to more features and rooms</p>
                </div>
                <Button onClick={() => window.location.href = '/payments'} data-testid="button-upgrade-plan">
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                placeholder="Enter your first name"
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="Enter your last name"
                data-testid="input-last-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Enter your phone number"
                data-testid="input-phone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
