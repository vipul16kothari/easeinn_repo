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
import { Calendar, Users, Building2, DollarSign, BookOpen, UserCheck, Clock, Bed, Plus, Settings, CreditCard, Mail, UserPlus } from "lucide-react";
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

  const addHotelMutation = useMutation({
    mutationFn: async (formData: HotelFormData) => {
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
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-gray-600 mt-1">
            Welcome back, {authData?.user?.firstName} {authData?.user?.lastName}
            <Badge variant="secondary" className="ml-2">
              {authData?.user?.role}
            </Badge>
          </div>
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
                  />
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
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4 mr-1" />
                        Contact Owner
                      </Button>
                      <Button size="sm" variant="outline">
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
    </div>
  );
}