import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CreditCard,
  Bed,
  ArrowRight,
  Pencil
} from "lucide-react";

interface ProfileItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: string;
  priority: number;
  editable?: boolean;
  fields?: string[];
}

interface HotelFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  gstNumber: string;
}

export default function ProfileCompleteness() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<HotelFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    gstNumber: "",
  });

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  }) as { data: { user: any; hotel: any } | undefined };

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
  }) as { data: any[] };

  const updateHotelMutation = useMutation({
    mutationFn: async (data: Partial<HotelFormData>) => {
      const response = await apiRequest("PATCH", `/api/hotels/${hotel?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditDialogOpen(false);
      toast({
        title: "Profile Updated",
        description: "Hotel profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const hotel = authData?.hotel;

  if (!hotel) return null;

  const profileItems: ProfileItem[] = [
    {
      id: "name",
      label: "Hotel Name",
      description: "Your property name",
      icon: <Building2 className="w-4 h-4" />,
      completed: !!hotel.name && hotel.name.trim() !== "",
      priority: 1,
      editable: true,
      fields: ["name"]
    },
    {
      id: "address",
      label: "Address",
      description: "Complete address with city and state",
      icon: <MapPin className="w-4 h-4" />,
      completed: !!hotel.address && !!hotel.city && !!hotel.state,
      priority: 2,
      editable: true,
      fields: ["address", "city", "state"]
    },
    {
      id: "phone",
      label: "Phone Number",
      description: "Contact phone for bookings",
      icon: <Phone className="w-4 h-4" />,
      completed: !!hotel.phone,
      priority: 3,
      editable: true,
      fields: ["phone"]
    },
    {
      id: "email",
      label: "Email Address",
      description: "Official hotel email",
      icon: <Mail className="w-4 h-4" />,
      completed: !!hotel.email,
      priority: 4,
      editable: true,
      fields: ["email"]
    },
    {
      id: "gst",
      label: "GST Number",
      description: "GST registration for invoicing",
      icon: <FileText className="w-4 h-4" />,
      completed: !!hotel.gstNumber,
      priority: 5,
      editable: true,
      fields: ["gstNumber"]
    },
    {
      id: "rooms",
      label: "Room Setup",
      description: `${rooms.length > 0 ? rooms.length : 0} room${rooms.length !== 1 ? 's' : ''} added`,
      icon: <Bed className="w-4 h-4" />,
      completed: rooms.length >= 1,
      action: "/rooms",
      priority: 6
    },
    {
      id: "payment",
      label: "Payment Setup",
      description: hotel.subscriptionPlan && hotel.subscriptionPlan !== "trial" ? "Active subscription" : "Subscribe to a plan",
      icon: <CreditCard className="w-4 h-4" />,
      completed: hotel.subscriptionPlan && hotel.subscriptionPlan !== "trial",
      action: "/payments",
      priority: 7
    }
  ];

  const completedCount = profileItems.filter(item => item.completed).length;
  const totalCount = profileItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const incompleteItems = profileItems
    .filter(item => !item.completed)
    .sort((a, b) => a.priority - b.priority);

  const nextAction = incompleteItems[0];

  const getCompletionMessage = () => {
    if (completionPercentage === 100) return "Your profile is complete!";
    if (completionPercentage >= 70) return "Almost there! Complete a few more items.";
    if (completionPercentage >= 40) return "Good progress! Keep going.";
    return "Let's complete your hotel profile";
  };

  const openEditDialog = (fieldId: string) => {
    setEditingField(fieldId);
    setFormData({
      name: hotel.name || "",
      address: hotel.address || "",
      city: hotel.city || "",
      state: hotel.state || "",
      phone: hotel.phone || "",
      email: hotel.email || "",
      gstNumber: hotel.gstNumber || "",
    });
    setEditDialogOpen(true);
  };

  const handleCompleteClick = () => {
    if (!nextAction) return;
    
    if (nextAction.editable) {
      openEditDialog(nextAction.id);
    } else if (nextAction.action) {
      setLocation(nextAction.action);
    }
  };

  const handleItemClick = (item: ProfileItem) => {
    if (item.editable && !item.completed) {
      openEditDialog(item.id);
    } else if (item.action) {
      setLocation(item.action);
    }
  };

  const handleSave = () => {
    const item = profileItems.find(i => i.id === editingField);
    if (!item?.fields) return;

    const updateData: Partial<HotelFormData> = {};
    item.fields.forEach(field => {
      updateData[field as keyof HotelFormData] = formData[field as keyof HotelFormData];
    });

    updateHotelMutation.mutate(updateData);
  };

  const getDialogTitle = () => {
    const titles: Record<string, string> = {
      name: "Hotel Name",
      address: "Hotel Address",
      phone: "Contact Phone",
      email: "Hotel Email",
      gst: "GST Number",
    };
    return titles[editingField || ""] || "Edit Profile";
  };

  return (
    <>
      <Card className="mb-6 border-purple-100 bg-gradient-to-r from-purple-50 to-white" data-testid="profile-completeness-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
              Profile Completeness
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${completionPercentage === 100 ? 'text-green-600' : 'text-purple-600'}`}>
                {completionPercentage}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Progress 
              value={completionPercentage} 
              className="h-3"
            />
            <p className="text-sm text-gray-600">{getCompletionMessage()}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2" data-testid="profile-items-grid">
            {profileItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex flex-col items-center p-2 rounded-lg text-center cursor-pointer transition-all hover:scale-105 ${
                  item.completed ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                title={item.description}
                data-testid={`profile-item-${item.id}`}
              >
                <div className={`p-2 rounded-full mb-1 ${
                  item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                }`}>
                  {item.completed ? <CheckCircle className="w-4 h-4" /> : item.icon}
                </div>
                <span className={`text-xs ${item.completed ? 'text-green-700' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {nextAction && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  {nextAction.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Next step: {nextAction.label}</p>
                  <p className="text-xs text-gray-500">{nextAction.description}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={handleCompleteClick}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-complete-profile"
              >
                Complete
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-purple-600" />
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              Complete this information to improve your profile.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editingField === "name" && (
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter hotel name"
                  data-testid="input-hotel-name"
                />
              </div>
            )}
            
            {editingField === "address" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter street address"
                    data-testid="input-address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      data-testid="input-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      data-testid="input-state"
                    />
                  </div>
                </div>
              </>
            )}
            
            {editingField === "phone" && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91-XXXXXXXXXX"
                  data-testid="input-phone"
                />
              </div>
            )}
            
            {editingField === "email" && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hotel@example.com"
                  data-testid="input-email"
                />
              </div>
            )}
            
            {editingField === "gst" && (
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  data-testid="input-gst"
                />
                <p className="text-xs text-gray-500">15-character GST Identification Number</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateHotelMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-save-profile"
            >
              {updateHotelMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
