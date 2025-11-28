import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  CheckCircle, 
  Circle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CreditCard,
  Camera,
  Globe,
  Users,
  Bed,
  ArrowRight
} from "lucide-react";

interface ProfileItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: string;
  priority: number;
}

export default function ProfileCompleteness() {
  const [, setLocation] = useLocation();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  }) as { data: { user: any; hotel: any } | undefined };

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
  }) as { data: any[] };

  const hotel = authData?.hotel;

  if (!hotel) return null;

  const profileItems: ProfileItem[] = [
    {
      id: "name",
      label: "Hotel Name",
      description: "Your property name",
      icon: <Building2 className="w-4 h-4" />,
      completed: !!hotel.name,
      priority: 1
    },
    {
      id: "address",
      label: "Address",
      description: "Complete address with city and state",
      icon: <MapPin className="w-4 h-4" />,
      completed: !!hotel.address && !!hotel.city && !!hotel.state,
      action: "/profile",
      priority: 2
    },
    {
      id: "phone",
      label: "Phone Number",
      description: "Contact phone for bookings",
      icon: <Phone className="w-4 h-4" />,
      completed: !!hotel.phone,
      action: "/profile",
      priority: 3
    },
    {
      id: "email",
      label: "Email Address",
      description: "Official hotel email",
      icon: <Mail className="w-4 h-4" />,
      completed: !!hotel.email,
      action: "/profile",
      priority: 4
    },
    {
      id: "gst",
      label: "GST Number",
      description: "GST registration for invoicing",
      icon: <FileText className="w-4 h-4" />,
      completed: !!hotel.gstNumber,
      action: "/profile",
      priority: 5
    },
    {
      id: "rooms",
      label: "Room Setup",
      description: "Add at least 5 rooms",
      icon: <Bed className="w-4 h-4" />,
      completed: rooms.length >= 5,
      action: "/rooms",
      priority: 6
    },
    {
      id: "payment",
      label: "Payment Setup",
      description: "Active subscription",
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

  const getCompletionColor = () => {
    if (completionPercentage < 40) return "bg-red-500";
    if (completionPercentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCompletionMessage = () => {
    if (completionPercentage === 100) return "Your profile is complete!";
    if (completionPercentage >= 70) return "Almost there! Complete a few more items.";
    if (completionPercentage >= 40) return "Good progress! Keep going.";
    return "Let's complete your hotel profile";
  };

  return (
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
              className={`flex flex-col items-center p-2 rounded-lg text-center ${
                item.completed ? 'bg-green-50' : 'bg-gray-50'
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
            {nextAction.action && (
              <Button 
                size="sm" 
                onClick={() => setLocation(nextAction.action!)}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-complete-profile"
              >
                Complete
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
