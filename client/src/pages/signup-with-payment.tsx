import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, Building, User, Mail, Phone, MapPin, CheckCircle, Sparkles } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxRooms: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "hotelier",
    name: "Hotelier Plan",
    price: 2999,
    maxRooms: 50,
    features: [
      "Up to 50 rooms",
      "Complete guest management",
      "GST compliant billing", 
      "Basic analytics & reports",
      "Email support"
    ]
  },
  {
    id: "enterprise", 
    name: "Enterprise Plan",
    price: 9999,
    maxRooms: 999,
    popular: true,
    features: [
      "Unlimited rooms & properties",
      "Advanced analytics & insights",
      "Custom integrations & API",
      "Priority support & training",
      "Dedicated account manager"
    ]
  }
];

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SignupWithPayment() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [razorpayKey, setRazorpayKey] = useState("");
  const [formData, setFormData] = useState({
    // Hotel details
    hotelName: "",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    panNumber: "",
    stateCode: "",
    // Owner details
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPassword: "",
    confirmPassword: ""
  });

  // Get plan from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan');
    if (planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, []);

  // Fetch Razorpay configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await apiRequest("GET", "/api/payments/config");
        setRazorpayKey(config.razorpay_key_id);
      } catch (error) {
        console.error("Failed to fetch Razorpay config:", error);
      }
    };
    fetchConfig();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/register-with-payment", data);
    },
    onSuccess: (response) => {
      handleRazorpayPayment(response.order, response.hotelId);
    },
    onError: (error) => {
      toast({
        title: "Registration Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = (order: any, hotelId: string) => {
    if (!window.Razorpay) {
      toast({
        title: "Payment Error",
        description: "Payment system not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: "EaseInn",
      description: `${selectedPlan?.name} subscription`,
      order_id: order.id,
      handler: async (response: any) => {
        try {
          await apiRequest("POST", "/api/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          
          toast({
            title: "Registration Successful!",
            description: "Your payment was processed and account created successfully",
          });
          
          // Redirect to login with success message
          setLocation("/login?registered=true");
          
        } catch (error) {
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support for assistance",
            variant: "destructive",
          });
        }
      },
      prefill: {
        name: `${formData.ownerFirstName} ${formData.ownerLastName}`,
        email: formData.ownerEmail,
        contact: formData.phone,
      },
      theme: {
        color: "#7c3aed",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast({
        title: "No Plan Selected",
        description: "Please select a subscription plan",
        variant: "destructive",
      });
      return;
    }

    if (formData.ownerPassword !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Submit registration with payment
    registerMutation.mutate({
      plan: selectedPlan,
      hotel: {
        name: formData.hotelName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        gstNumber: formData.gstNumber,
        panNumber: formData.panNumber,
        stateCode: formData.stateCode,
        maxRooms: selectedPlan.maxRooms,
        subscriptionPlan: selectedPlan.name
      },
      owner: {
        firstName: formData.ownerFirstName,
        lastName: formData.ownerLastName,
        email: formData.ownerEmail,
        password: formData.ownerPassword,
        role: "hotelier"
      }
    });
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Select a Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please select a subscription plan first.</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Registration</h1>
          <p className="text-gray-600 text-lg">Sign up for {selectedPlan.name} and start managing your hotel</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Selected Plan Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Selected Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  {selectedPlan.popular && (
                    <Badge className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-2xl font-bold text-purple-600">{selectedPlan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{selectedPlan.price.toLocaleString("en-IN")}/month
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full mt-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Hotel & Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Hotel Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Hotel Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hotelName">Hotel Name *</Label>
                        <Input
                          id="hotelName"
                          name="hotelName"
                          value={formData.hotelName}
                          onChange={handleInputChange}
                          required
                          placeholder="Grand Palace Hotel"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          placeholder="Complete hotel address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Hotel Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="info@hotel.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          name="gstNumber"
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="panNumber">PAN Number</Label>
                        <Input
                          id="panNumber"
                          name="panNumber"
                          value={formData.panNumber}
                          onChange={handleInputChange}
                          placeholder="AAAAA0000A"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stateCode">State Code</Label>
                        <Input
                          id="stateCode"
                          name="stateCode"
                          value={formData.stateCode}
                          onChange={handleInputChange}
                          placeholder="27 (Maharashtra)"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Owner Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Owner Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ownerFirstName">First Name *</Label>
                        <Input
                          id="ownerFirstName"
                          name="ownerFirstName"
                          value={formData.ownerFirstName}
                          onChange={handleInputChange}
                          required
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ownerLastName">Last Name *</Label>
                        <Input
                          id="ownerLastName"
                          name="ownerLastName"
                          value={formData.ownerLastName}
                          onChange={handleInputChange}
                          required
                          placeholder="Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ownerEmail">Email Address *</Label>
                        <Input
                          id="ownerEmail"
                          name="ownerEmail"
                          type="email"
                          value={formData.ownerEmail}
                          onChange={handleInputChange}
                          required
                          placeholder="john@hotel.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ownerPassword">Password *</Label>
                        <Input
                          id="ownerPassword"
                          name="ownerPassword"
                          type="password"
                          value={formData.ownerPassword}
                          onChange={handleInputChange}
                          required
                          placeholder="Strong password"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Payment Summary
                    </h3>
                    <div className="flex justify-between items-center text-lg">
                      <span>Monthly Subscription:</span>
                      <span className="font-bold">₹{selectedPlan.price.toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Secure payment processed by Razorpay. You can cancel anytime.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    {registerMutation.isPending ? (
                      "Processing..."
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Complete Registration & Pay ₹{selectedPlan.price.toLocaleString("en-IN")}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By continuing, you agree to our{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{" "}
                    <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}