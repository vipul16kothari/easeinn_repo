import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Building2, DollarSign, BookOpen, UserCheck, Clock, Bed, Plus, Settings, CreditCard, Mail, UserPlus, LogOut } from "lucide-react";
import { X, Save } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminStats {
  totalHotels: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: string;
  activeCheckIns: number;
  availableRooms: number;
  occupancyRate: number;
  monthlyRevenue: string;
  yearlyRevenue: string;
}

interface Hotel {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  ownerId: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  subscriptionPlan?: string;
  monthlyRate: string;
  isActive: boolean;
  ownerName?: string;
  maxRooms: number;
  enabledRooms: number;
  roomTypes: string[];
  features: string[];
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    petPolicy: boolean;
    smokingPolicy: boolean;
  };
  pricing: {
    baseRate: number;
    weekendSurcharge: number;
    seasonalRates: Record<string, number>;
    taxRate: number;
  };
  settings: {
    allowAdvanceBooking: boolean;
    advanceBookingDays: number;
    requireApproval: boolean;
    autoConfirm: boolean;
    enablePayments: boolean;
    currency: string;
  };
}

interface HotelFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  stateCode: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPassword: string;
  subscriptionPlan: string;
  monthlyRate: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddHotelOpen, setIsAddHotelOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isEditHotelOpen, setIsEditHotelOpen] = useState(false);
  const [isContactOwnerOpen, setIsContactOwnerOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [editingHotelConfig, setEditingHotelConfig] = useState<Partial<Hotel>>({});
  const [hotelFormData, setHotelFormData] = useState<HotelFormData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    panNumber: "",
    stateCode: "",
    ownerEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerPassword: "",
    subscriptionPlan: "basic",
    monthlyRate: "5000",
    subscriptionStartDate: new Date().toISOString().split('T')[0],
    subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const { data: hotels } = useQuery<Hotel[]>({
    queryKey: ["/api/admin/hotels"],
  });

  const updateHotelMutation = useMutation({
    mutationFn: async ({ hotelId, updates }: { hotelId: string; updates: Partial<Hotel> }) => {
      return await apiRequest("PATCH", `/api/admin/hotels/${hotelId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hotel configuration updated successfully",
      });
      setIsEditHotelOpen(false);
      setEditingHotelConfig({});
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update hotel",
        variant: "destructive",
      });
    },
  });

  const addHotelMutation = useMutation({
    mutationFn: async (formData: HotelFormData) => {
      // Validate required fields
      const errors = [];
      if (!formData.name?.trim()) errors.push("Hotel name is required");
      if (!formData.address?.trim()) errors.push("Hotel address is required");
      if (!formData.phone?.trim()) errors.push("Hotel phone is required");
      if (!formData.ownerFirstName?.trim()) errors.push("Owner first name is required");
      if (!formData.ownerLastName?.trim()) errors.push("Owner last name is required");
      if (!formData.ownerEmail?.trim()) errors.push("Owner email is required");
      if (!formData.ownerPassword?.trim()) errors.push("Owner password is required");
      if (!formData.subscriptionPlan?.trim()) errors.push("Subscription plan is required");
      if (!formData.monthlyRate?.trim()) errors.push("Monthly rate is required");
      if (!formData.subscriptionStartDate?.trim()) errors.push("Subscription start date is required");
      if (!formData.subscriptionEndDate?.trim()) errors.push("Subscription end date is required");
      
      // Email validation
      if (formData.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
        errors.push("Valid email address is required");
      }
      
      if (errors.length > 0) {
        throw new Error(errors.join(". "));
      }

      return await apiRequest("POST", "/api/admin/hotels", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hotel and owner account created successfully",
      });
      setIsAddHotelOpen(false);
      setHotelFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        gstNumber: "",
        panNumber: "",
        stateCode: "",
        ownerEmail: "",
        ownerFirstName: "",
        ownerLastName: "",
        ownerPassword: "",
        subscriptionPlan: "basic",
        monthlyRate: "5000",
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create hotel",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">EaseInn Admin</h1>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Super Admin Console
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {authData?.user?.firstName} {authData?.user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{authData?.user?.email}</p>
              </div>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Dashboard Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
            <p className="text-gray-600 mt-1">
              Manage hotels, subscriptions, and platform settings
            </p>
          </div>
        <Dialog open={isAddHotelOpen} onOpenChange={setIsAddHotelOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Hotel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Hotel & Owner</DialogTitle>
              <DialogDescription>
                Create a new hotel property and set up the owner account with subscription details.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="hotel" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hotel">Hotel Details</TabsTrigger>
                <TabsTrigger value="owner">Owner Account</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="hotel" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotelName">Hotel Name *</Label>
                    <Input
                      id="hotelName"
                      value={hotelFormData.name}
                      onChange={(e) => setHotelFormData({...hotelFormData, name: e.target.value})}
                      placeholder="Grand Palace Hotel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotelPhone">Phone Number *</Label>
                    <Input
                      id="hotelPhone"
                      value={hotelFormData.phone}
                      onChange={(e) => setHotelFormData({...hotelFormData, phone: e.target.value})}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hotelEmail">Hotel Email *</Label>
                  <Input
                    id="hotelEmail"
                    type="email"
                    value={hotelFormData.email}
                    onChange={(e) => setHotelFormData({...hotelFormData, email: e.target.value})}
                    placeholder="info@grandpalace.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={hotelFormData.address}
                    onChange={(e) => setHotelFormData({...hotelFormData, address: e.target.value})}
                    placeholder="123 Main Street, City, State, Pincode"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={hotelFormData.gstNumber}
                      onChange={(e) => setHotelFormData({...hotelFormData, gstNumber: e.target.value})}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={hotelFormData.panNumber}
                      onChange={(e) => setHotelFormData({...hotelFormData, panNumber: e.target.value})}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateCode">State Code *</Label>
                    <Select value={hotelFormData.stateCode} onValueChange={(value) => setHotelFormData({...hotelFormData, stateCode: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DL">Delhi (DL)</SelectItem>
                        <SelectItem value="MH">Maharashtra (MH)</SelectItem>
                        <SelectItem value="KA">Karnataka (KA)</SelectItem>
                        <SelectItem value="TN">Tamil Nadu (TN)</SelectItem>
                        <SelectItem value="GJ">Gujarat (GJ)</SelectItem>
                        <SelectItem value="RJ">Rajasthan (RJ)</SelectItem>
                        <SelectItem value="UP">Uttar Pradesh (UP)</SelectItem>
                        <SelectItem value="WB">West Bengal (WB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="owner" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFirstName">First Name *</Label>
                    <Input
                      id="ownerFirstName"
                      value={hotelFormData.ownerFirstName}
                      onChange={(e) => setHotelFormData({...hotelFormData, ownerFirstName: e.target.value})}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerLastName">Last Name *</Label>
                    <Input
                      id="ownerLastName"
                      value={hotelFormData.ownerLastName}
                      onChange={(e) => setHotelFormData({...hotelFormData, ownerLastName: e.target.value})}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Owner Email (Login) *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={hotelFormData.ownerEmail}
                    onChange={(e) => setHotelFormData({...hotelFormData, ownerEmail: e.target.value})}
                    placeholder="john.doe@grandpalace.com"
                    required
                  />
                  {!hotelFormData.ownerEmail && (
                    <p className="text-xs text-red-500">Email is required for hotel owner login</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Temporary Password *</Label>
                  <Input
                    id="ownerPassword"
                    type="password"
                    value={hotelFormData.ownerPassword}
                    onChange={(e) => setHotelFormData({...hotelFormData, ownerPassword: e.target.value})}
                    placeholder="Enter temporary password"
                  />
                  <p className="text-xs text-gray-500">Owner can change this after first login</p>
                </div>
              </TabsContent>
              
              <TabsContent value="subscription" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan">Subscription Plan *</Label>
                    <Select value={hotelFormData.subscriptionPlan} onValueChange={(value) => setHotelFormData({...hotelFormData, subscriptionPlan: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic - ₹5,000/month</SelectItem>
                        <SelectItem value="standard">Standard - ₹10,000/month</SelectItem>
                        <SelectItem value="premium">Premium - ₹20,000/month</SelectItem>
                        <SelectItem value="enterprise">Enterprise - ₹50,000/month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRate">Monthly Rate (₹) *</Label>
                    <Input
                      id="monthlyRate"
                      type="number"
                      value={hotelFormData.monthlyRate}
                      onChange={(e) => setHotelFormData({...hotelFormData, monthlyRate: e.target.value})}
                      placeholder="5000"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionStart">Subscription Start Date *</Label>
                    <Input
                      id="subscriptionStart"
                      type="date"
                      value={hotelFormData.subscriptionStartDate}
                      onChange={(e) => setHotelFormData({...hotelFormData, subscriptionStartDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionEnd">Subscription End Date *</Label>
                    <Input
                      id="subscriptionEnd"
                      type="date"
                      value={hotelFormData.subscriptionEndDate}
                      onChange={(e) => setHotelFormData({...hotelFormData, subscriptionEndDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Subscription Summary</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Plan: {hotelFormData.subscriptionPlan} - ₹{hotelFormData.monthlyRate}/month
                  </p>
                  <p className="text-sm text-blue-700">
                    Duration: {hotelFormData.subscriptionStartDate} to {hotelFormData.subscriptionEndDate}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddHotelOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => addHotelMutation.mutate(hotelFormData)}
                disabled={addHotelMutation.isPending}
              >
                {addHotelMutation.isPending ? "Creating..." : "Create Hotel & Owner"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hotels">Hotels ({stats?.totalHotels || 0})</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats?.totalRevenue || "0"}</div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats?.monthlyRevenue || "0"}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yearly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats?.yearlyRevenue || "0"}</div>
                <p className="text-xs text-muted-foreground">This year</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Hotels</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalHotels || 0}</div>
                <p className="text-xs text-muted-foreground">Properties managed</p>
              </CardContent>
            </Card>
          </div>

          {/* Operational Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
                <p className="text-xs text-muted-foreground">All time bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Check-ins</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeCheckIns || 0}</div>
                <p className="text-xs text-muted-foreground">Currently checked in</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.availableRooms || 0}</div>
                <p className="text-xs text-muted-foreground">Ready for booking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.occupancyRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Current occupancy</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hotels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Management</CardTitle>
              <CardDescription>
                Manage all hotel properties, their owners, and subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hotels?.map((hotel) => (
                  <div key={hotel.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">{hotel.name}</h3>
                          <p className="text-sm text-gray-600">{hotel.address}</p>
                        </div>
                      </div>
                      <Badge variant={hotel.isActive ? "default" : "secondary"}>
                        {hotel.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Contact:</span>
                        <p>{hotel.phone}</p>
                        <p>{hotel.email}</p>
                      </div>
                      <div>
                        <span className="font-medium">Owner:</span>
                        <p>{hotel.ownerName || "N/A"}</p>
                        <span className="font-medium">Plan:</span>
                        <p>{hotel.subscriptionPlan || "N/A"} - ₹{hotel.monthlyRate}/month</p>
                      </div>
                      <div>
                        <span className="font-medium">Subscription:</span>
                        <p>Start: {hotel.subscriptionStartDate ? new Date(hotel.subscriptionStartDate).toLocaleDateString() : "N/A"}</p>
                        <p>End: {hotel.subscriptionEndDate ? new Date(hotel.subscriptionEndDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setEditingHotelConfig({});
                          setIsEditHotelOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setIsContactOwnerOpen(true);
                        }}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Contact Owner
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setIsBillingOpen(true);
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Billing
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    No hotels found. Click "Add New Hotel" to create the first property.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Financial overview across all properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-800">₹{stats?.totalRevenue || "0"}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-blue-800">₹{stats?.monthlyRevenue || "0"}</p>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Yearly Revenue</p>
                  <p className="text-2xl font-bold text-purple-800">₹{stats?.yearlyRevenue || "0"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Revenue</CardTitle>
                <CardDescription>Monthly recurring revenue from subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Monthly Subscriptions</p>
                    <p className="text-2xl font-bold text-orange-800">
                      ₹{hotels?.reduce((sum, hotel) => sum + parseFloat(hotel.monthlyRate || "0"), 0) || 0}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      From {stats?.totalHotels || 0} active hotels
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>System configuration and global settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Super Admin Email</Label>
                  <Input value={authData?.user?.email || ""} disabled />
                  <p className="text-xs text-gray-500">This is your super admin account</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Default Subscription Plan</Label>
                  <Select defaultValue="basic">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic - ₹5,000/month</SelectItem>
                      <SelectItem value="standard">Standard - ₹10,000/month</SelectItem>
                      <SelectItem value="premium">Premium - ₹20,000/month</SelectItem>
                      <SelectItem value="enterprise">Enterprise - ₹50,000/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Update Platform Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Monitor system health and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Services</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Gateway</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Service</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Hotel Dialog */}
      <Dialog open={isEditHotelOpen} onOpenChange={setIsEditHotelOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hotel Configuration: {selectedHotel?.name}</DialogTitle>
            <DialogDescription>
              Comprehensive hotel management and configuration settings
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rooms">Room Management</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hotel Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Hotel Name</Label>
                      <Input 
                        value={editingHotelConfig.name || selectedHotel?.name || ""} 
                        onChange={(e) => setEditingHotelConfig({...editingHotelConfig, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        value={editingHotelConfig.phone || selectedHotel?.phone || ""} 
                        onChange={(e) => setEditingHotelConfig({...editingHotelConfig, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        value={editingHotelConfig.email || selectedHotel?.email || ""} 
                        onChange={(e) => setEditingHotelConfig({...editingHotelConfig, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <textarea 
                        className="w-full p-2 border rounded-md resize-none"
                        rows={3}
                        value={editingHotelConfig.address || selectedHotel?.address || ""}
                        onChange={(e) => setEditingHotelConfig({...editingHotelConfig, address: e.target.value})}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Subscription Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Current Plan</Label>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-semibold capitalize">{selectedHotel?.subscriptionPlan || "N/A"}</p>
                        <p className="text-sm text-gray-600">₹{selectedHotel?.monthlyRate || "0"}/month</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input 
                          value={selectedHotel?.subscriptionStartDate ? 
                            new Date(selectedHotel.subscriptionStartDate).toLocaleDateString() : 
                            "N/A"} 
                          disabled 
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input 
                          value={selectedHotel?.subscriptionEndDate ? 
                            new Date(selectedHotel.subscriptionEndDate).toLocaleDateString() : 
                            "N/A"} 
                          disabled 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Room Inventory</CardTitle>
                    <CardDescription>Control room availability and capacity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Maximum Rooms</Label>
                        <Input 
                          type="number" 
                          value={editingHotelConfig.maxRooms || selectedHotel?.maxRooms || 50} 
                          onChange={(e) => setEditingHotelConfig({...editingHotelConfig, maxRooms: parseInt(e.target.value) || 50})}
                          placeholder="50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Total rooms hotel can manage</p>
                      </div>
                      <div>
                        <Label>Enabled Rooms</Label>
                        <Input 
                          type="number" 
                          value={editingHotelConfig.enabledRooms || selectedHotel?.enabledRooms || 10} 
                          onChange={(e) => setEditingHotelConfig({...editingHotelConfig, enabledRooms: parseInt(e.target.value) || 10})}
                          placeholder="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">Currently active room count</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Room Utilization</span>
                        <span className="text-sm text-green-600">
                          {editingHotelConfig.enabledRooms || selectedHotel?.enabledRooms || 0}/{editingHotelConfig.maxRooms || selectedHotel?.maxRooms || 50}
                        </span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${((editingHotelConfig.enabledRooms || selectedHotel?.enabledRooms || 0) / (editingHotelConfig.maxRooms || selectedHotel?.maxRooms || 50)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Room Types</CardTitle>
                    <CardDescription>Available room categories</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {(editingHotelConfig.roomTypes || selectedHotel?.roomTypes || ['standard', 'deluxe', 'suite']).map((roomType, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="capitalize font-medium">{roomType}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Available</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentRoomTypes = editingHotelConfig.roomTypes || selectedHotel?.roomTypes || [];
                                setEditingHotelConfig({
                                  ...editingHotelConfig,
                                  roomTypes: currentRoomTypes.filter((_, i) => i !== index)
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        const newRoomType = prompt("Enter new room type name:");
                        if (newRoomType?.trim()) {
                          const currentRoomTypes = editingHotelConfig.roomTypes || selectedHotel?.roomTypes || ['standard', 'deluxe', 'suite'];
                          setEditingHotelConfig({
                            ...editingHotelConfig,
                            roomTypes: [...currentRoomTypes, newRoomType.trim().toLowerCase()]
                          });
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Room Type
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hotel Features</CardTitle>
                  <CardDescription>Available amenities and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {(selectedHotel?.features || ['wifi', 'ac', 'tv', 'parking']).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="capitalize text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Check-in/Check-out Policies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Check-in Time</Label>
                        <Input value={selectedHotel?.policies?.checkInTime || "14:00"} />
                      </div>
                      <div>
                        <Label>Check-out Time</Label>
                        <Input value={selectedHotel?.policies?.checkOutTime || "11:00"} />
                      </div>
                    </div>
                    <div>
                      <Label>Cancellation Policy</Label>
                      <Input value={selectedHotel?.policies?.cancellationPolicy || "24 hours"} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Property Policies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Pet Policy</Label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={selectedHotel?.policies?.petPolicy || false} 
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Allow Pets</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Smoking Policy</Label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={selectedHotel?.policies?.smokingPolicy || false} 
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Allow Smoking</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Base Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Base Room Rate (₹/night)</Label>
                      <Input 
                        type="number" 
                        value={editingHotelConfig.pricing?.baseRate || selectedHotel?.pricing?.baseRate || 2000} 
                        onChange={(e) => setEditingHotelConfig({
                          ...editingHotelConfig, 
                          pricing: {
                            ...editingHotelConfig.pricing,
                            ...selectedHotel?.pricing,
                            baseRate: parseInt(e.target.value) || 2000
                          }
                        })}
                        placeholder="2000"
                      />
                    </div>
                    <div>
                      <Label>Weekend Surcharge (₹)</Label>
                      <Input 
                        type="number" 
                        value={editingHotelConfig.pricing?.weekendSurcharge || selectedHotel?.pricing?.weekendSurcharge || 500} 
                        onChange={(e) => setEditingHotelConfig({
                          ...editingHotelConfig, 
                          pricing: {
                            ...editingHotelConfig.pricing,
                            ...selectedHotel?.pricing,
                            weekendSurcharge: parseInt(e.target.value) || 500
                          }
                        })}
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <Label>Tax Rate (%)</Label>
                      <Input 
                        type="number" 
                        value={editingHotelConfig.pricing?.taxRate || selectedHotel?.pricing?.taxRate || 18} 
                        onChange={(e) => setEditingHotelConfig({
                          ...editingHotelConfig, 
                          pricing: {
                            ...editingHotelConfig.pricing,
                            ...selectedHotel?.pricing,
                            taxRate: parseInt(e.target.value) || 18
                          }
                        })}
                        placeholder="18"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Seasonal Pricing</CardTitle>
                    <CardDescription>Special rates for different seasons</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No seasonal rates configured</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Add Seasonal Rate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Booking Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Allow Advance Booking</Label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={selectedHotel?.settings?.allowAdvanceBooking || true} 
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    </div>
                    <div>
                      <Label>Advance Booking Days</Label>
                      <Input 
                        type="number" 
                        value={selectedHotel?.settings?.advanceBookingDays || 90} 
                        placeholder="90"
                      />
                      <p className="text-xs text-gray-500 mt-1">How many days in advance can guests book</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-confirm Bookings</Label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={selectedHotel?.settings?.autoConfirm || true} 
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Online Payments</Label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={selectedHotel?.settings?.enablePayments || true} 
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select value={selectedHotel?.settings?.currency || "INR"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditHotelOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedHotel) {
                  updateHotelMutation.mutate({
                    hotelId: selectedHotel.id,
                    updates: editingHotelConfig
                  });
                }
              }}
              disabled={updateHotelMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {updateHotelMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Owner Dialog */}
      <Dialog open={isContactOwnerOpen} onOpenChange={setIsContactOwnerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Hotel Owner</DialogTitle>
            <DialogDescription>
              Send a message or notification to the hotel owner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hotel</Label>
              <Input value={selectedHotel?.name || ""} disabled />
            </div>
            <div>
              <Label>Owner Name</Label>
              <Input value={selectedHotel?.ownerName || "N/A"} disabled />
            </div>
            <div>
              <Label>Message Subject</Label>
              <Input placeholder="Enter message subject..." />
            </div>
            <div>
              <Label>Message</Label>
              <textarea 
                className="w-full p-3 border rounded-md resize-none"
                rows={4}
                placeholder="Enter your message to the hotel owner..."
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> This will send an email notification to the hotel owner.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsContactOwnerOpen(false)}>
              Cancel
            </Button>
            <Button>
              <Mail className="h-4 w-4 mr-1" />
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Billing Dialog */}
      <Dialog open={isBillingOpen} onOpenChange={setIsBillingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Billing & Subscription</DialogTitle>
            <DialogDescription>
              Manage subscription billing for {selectedHotel?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Plan Type</p>
                    <p className="font-semibold capitalize">{selectedHotel?.subscriptionPlan || "N/A"}</p>
                    <p className="text-sm text-gray-600">Monthly Rate</p>
                    <p className="font-semibold">₹{selectedHotel?.monthlyRate || "0"}/month</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Subscription Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold">
                      {selectedHotel?.subscriptionStartDate ? 
                        new Date(selectedHotel.subscriptionStartDate).toLocaleDateString() : 
                        "N/A"
                      }
                    </p>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold">
                      {selectedHotel?.subscriptionEndDate ? 
                        new Date(selectedHotel.subscriptionEndDate).toLocaleDateString() : 
                        "N/A"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Billing Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" size="sm">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Generate Invoice
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Extend Subscription
                  </Button>
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Payment History
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Change Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Status:</strong> Subscription is active and in good standing.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBillingOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}