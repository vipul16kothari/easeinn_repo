import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHotelConfig } from "@/hooks/useHotelConfig";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { QRCodeSVG } from "qrcode.react";
import { 
  User, 
  Hotel, 
  CreditCard, 
  Calendar, 
  Settings, 
  Crown,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode,
  Copy,
  Download,
  RefreshCw,
  Loader2
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
  const [selfCheckInEnabled, setSelfCheckInEnabled] = useState(false);

  useEffect(() => {
    if (hotel) {
      setSelfCheckInEnabled(hotel.selfCheckInEnabled ?? true);
    }
  }, [hotel]);

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

  const generateQrSlugMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/hotel/generate-qr-slug");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "QR Code Generated",
        description: "Your self check-in QR code has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code.",
        variant: "destructive",
      });
    },
  });

  const toggleSelfCheckInMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest("PATCH", "/api/hotel/self-checkin-settings", { enabled });
      return response.json();
    },
    onSuccess: (data) => {
      setSelfCheckInEnabled(data.selfCheckInEnabled);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: data.selfCheckInEnabled ? "Self Check-in Enabled" : "Self Check-in Disabled",
        description: data.selfCheckInEnabled 
          ? "Guests can now use the QR code to submit check-in requests." 
          : "Self check-in has been disabled for your hotel.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const handleCopyLink = () => {
    if (hotel?.selfCheckInSlug) {
      const url = `${window.location.origin}/checkin/${hotel.selfCheckInSlug}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Self check-in link copied to clipboard.",
      });
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${hotel?.name || "hotel"}-qr-code.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
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

        {/* QR Code Self Check-in Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Self Check-in
            </CardTitle>
            <CardDescription>
              Allow guests to submit check-in requests by scanning a QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* QR Code Display */}
              <div className="flex flex-col items-center">
                {hotel.selfCheckInSlug ? (
                  <>
                    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                      <QRCodeSVG
                        id="qr-code-svg"
                        value={`${window.location.origin}/checkin/${hotel.selfCheckInSlug}`}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Scan this code to open the self check-in form
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyLink} data-testid="button-copy-qr-link">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadQR} data-testid="button-download-qr">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No QR code generated yet</p>
                    <Button 
                      onClick={() => generateQrSlugMutation.mutate()}
                      disabled={generateQrSlugMutation.isPending}
                      data-testid="button-generate-qr"
                    >
                      {generateQrSlugMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 mr-2" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Check-in Link</h4>
                  {hotel.selfCheckInSlug ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/checkin/${hotel.selfCheckInSlug}`}
                        className="font-mono text-sm"
                        data-testid="input-qr-url"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => generateQrSlugMutation.mutate()}
                        disabled={generateQrSlugMutation.isPending}
                        title="Regenerate QR Code"
                        data-testid="button-regenerate-qr"
                      >
                        <RefreshCw className={`h-4 w-4 ${generateQrSlugMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Generate a QR code to get your check-in link</p>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="self-checkin-toggle" className="font-medium">Enable Self Check-in</Label>
                    <p className="text-sm text-gray-600">
                      When enabled, guests can submit check-in requests using the QR code
                    </p>
                  </div>
                  <Switch
                    id="self-checkin-toggle"
                    checked={selfCheckInEnabled}
                    onCheckedChange={(checked) => toggleSelfCheckInMutation.mutate(checked)}
                    disabled={toggleSelfCheckInMutation.isPending}
                    data-testid="switch-self-checkin"
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How it works</h4>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Print and display the QR code at your reception or entrance</li>
                    <li>Guests scan the code with their phone camera</li>
                    <li>They fill out the check-in form with their details</li>
                    <li>You receive the request in your dashboard for approval</li>
                    <li>Assign a room and complete the check-in</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
