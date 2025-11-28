import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  CreditCard, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Sparkles,
  Star,
  Globe,
  Search,
  Loader2
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxRooms: number;
  popular?: boolean;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  types: string[];
  photoReferences: string[];
}

const createPlans = (hotelierPrice: number, enterprisePrice: number): Plan[] => [
  {
    id: "hotelier",
    name: "Hotelier Plan",
    price: hotelierPrice,
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
    price: enterprisePrice,
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

declare global {
  interface Window {
    Razorpay: any;
    google: any;
    initPlacesAutocomplete: () => void;
  }
}

export default function SignupPlaces() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [razorpayKey, setRazorpayKey] = useState("");
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    ownerEmail: "",
    ownerPassword: "",
    confirmPassword: "",
    ownerPhone: ""
  });

  const { data: pricingConfig, isLoading: isPricingLoading } = useQuery({
    queryKey: ["/api/admin/pricing-config"],
    retry: false,
  }) as { data: { hotelierPrice: number; enterprisePrice: number } | undefined; isLoading: boolean };

  const plans = createPlans(
    pricingConfig?.hotelierPrice || 2999,
    pricingConfig?.enterprisePrice || 9999
  );

  useEffect(() => {
    document.title = "Sign Up - EaseInn Hotel Management";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Sign up for EaseInn hotel management. Just search for your hotel and we auto-fill the details from Google Places.');
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan');
    if (planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      }
    }
  }, [pricingConfig]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await apiRequest("GET", "/api/payments/config");
        const config = await response.json();
        setRazorpayKey(config.razorpay_key_id);
      } catch (error) {
        console.error("Failed to fetch Razorpay config:", error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const loadGooglePlaces = async () => {
      try {
        const response = await apiRequest("GET", "/api/places/config");
        const config = await response.json();
        
        if (!config.apiKey) {
          console.error("Google Places API key not configured");
          return;
        }

        if (window.google?.maps?.places) {
          initPlacesServices();
          return;
        }

        window.initPlacesAutocomplete = () => {
          initPlacesServices();
        };

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=places&callback=initPlacesAutocomplete`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      } catch (error) {
        console.error("Failed to load Google Places:", error);
      }
    };

    loadGooglePlaces();
  }, []);

  const initPlacesServices = () => {
    if (window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      setPlacesLoaded(true);
    }
  };

  const searchPlaces = useCallback((query: string) => {
    if (!query || query.length < 3 || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    setIsSearching(true);
    
    const request = {
      input: query,
      types: ['lodging'],
      componentRestrictions: { country: 'in' },
      sessionToken: sessionTokenRef.current
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (results: any[], status: any) => {
      setIsSearching(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
        setShowPredictions(true);
      } else {
        setPredictions([]);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchPlaces]);

  const handlePlaceSelect = (prediction: any) => {
    if (!placesServiceRef.current) return;

    setIsSearching(true);
    setShowPredictions(false);

    const request = {
      placeId: prediction.place_id,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'formatted_phone_number',
        'international_phone_number',
        'website',
        'rating',
        'user_ratings_total',
        'geometry',
        'address_components',
        'types',
        'photos'
      ],
      sessionToken: sessionTokenRef.current
    };

    placesServiceRef.current.getDetails(request, (place: any, status: any) => {
      setIsSearching(false);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const addressComponents = place.address_components || [];
        let city = '', state = '', country = '', postalCode = '';
        
        addressComponents.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        const photoReferences = place.photos?.map((photo: any) => photo.getUrl({ maxWidth: 800 })) || [];

        const placeDetails: PlaceDetails = {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          phone: place.formatted_phone_number || place.international_phone_number || '',
          website: place.website || '',
          rating: place.rating || 0,
          reviewCount: place.user_ratings_total || 0,
          latitude: place.geometry?.location?.lat() || 0,
          longitude: place.geometry?.location?.lng() || 0,
          city,
          state,
          country,
          postalCode,
          types: place.types || [],
          photoReferences
        };

        setSelectedPlace(placeDetails);
        setSearchQuery(place.name);
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

        toast({
          title: "Hotel Found!",
          description: `${place.name} details have been auto-filled`,
        });
      }
    });
  };

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/register-with-places", data);
      return await response.json();
    },
    onSuccess: (data) => {
      handleRazorpayPayment(data.order, data.hotel.id);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create account";
      try {
        if (error.message) {
          const parts = error.message.split(': ');
          if (parts.length > 1) {
            const errorData = JSON.parse(parts.slice(1).join(': '));
            if (errorData.errorCode === "USER_EXISTS") {
              errorMessage = "This email is already registered. Please sign in instead.";
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          }
        }
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

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
          const verifyResponse = await apiRequest("POST", "/api/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          
          const verifyResult = await verifyResponse.json();
          
          if (verifyResult.status === 'success') {
            toast({
              title: "Registration Successful!",
              description: "Your payment was processed and account created successfully",
            });
            setLocation("/login?registered=true");
          } else {
            throw new Error("Payment verification failed");
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support for assistance",
            variant: "destructive",
          });
        }
      },
      prefill: {
        email: formData.ownerEmail,
        contact: formData.ownerPhone || selectedPlace?.phone,
      },
      theme: {
        color: "#7c3aed",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

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

    if (!selectedPlace) {
      toast({
        title: "No Hotel Selected",
        description: "Please search and select your hotel from Google Places",
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

    if (formData.ownerPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      plan: selectedPlan,
      placeDetails: selectedPlace,
      owner: {
        email: formData.ownerEmail,
        password: formData.ownerPassword,
        phone: formData.ownerPhone,
        role: "hotelier"
      }
    });
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Select a Plan First</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">Please select a subscription plan to continue.</p>
            <Button onClick={() => setLocation("/")} className="w-full" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Get Started with EaseInn
          </h1>
          <p className="text-gray-600 text-lg">
            Just search for your hotel - we'll auto-fill everything else
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-4 shadow-lg border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Your Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {selectedPlan.popular && (
                    <Badge className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-xl font-bold text-purple-600">{selectedPlan.name}</h3>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{selectedPlan.price.toLocaleString("en-IN")}/mo
                  </div>
                </div>
                
                <Separator />
                
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  Find Your Hotel
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Search for your hotel and we'll auto-fill the details from Google
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                    <Label htmlFor="hotelSearch" className="text-base font-medium">
                      Search Your Hotel *
                    </Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        ref={searchInputRef}
                        id="hotelSearch"
                        data-testid="input-hotel-search"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (!e.target.value) {
                            setSelectedPlace(null);
                          }
                        }}
                        onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                        placeholder="Type your hotel name..."
                        className="pl-10 pr-10 h-12 text-lg"
                        autoComplete="off"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 animate-spin" />
                      )}
                    </div>

                    {showPredictions && predictions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {predictions.map((prediction: any) => (
                          <button
                            key={prediction.place_id}
                            type="button"
                            onClick={() => handlePlaceSelect(prediction)}
                            className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b last:border-b-0 transition-colors"
                            data-testid={`prediction-${prediction.place_id}`}
                          >
                            <div className="font-medium text-gray-900">
                              {prediction.structured_formatting?.main_text}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {prediction.structured_formatting?.secondary_text}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedPlace && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            {selectedPlace.name}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {selectedPlace.address}
                          </p>
                        </div>
                        {selectedPlace.rating > 0 && (
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{selectedPlace.rating}</span>
                            <span className="text-xs text-gray-500">({selectedPlace.reviewCount})</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedPlace.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{selectedPlace.phone}</span>
                          </div>
                        )}
                        {selectedPlace.website && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe className="w-4 h-4" />
                            <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                              Website
                            </a>
                          </div>
                        )}
                        {selectedPlace.city && (
                          <div className="text-gray-600">
                            <span className="font-medium">City:</span> {selectedPlace.city}
                          </div>
                        )}
                        {selectedPlace.state && (
                          <div className="text-gray-600">
                            <span className="font-medium">State:</span> {selectedPlace.state}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Your Account Details
                    </h3>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="ownerEmail">Email Address *</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="ownerEmail"
                            name="ownerEmail"
                            type="email"
                            data-testid="input-owner-email"
                            value={formData.ownerEmail}
                            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                            required
                            placeholder="you@hotel.com"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="ownerPhone">Phone Number</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="ownerPhone"
                            name="ownerPhone"
                            type="tel"
                            data-testid="input-owner-phone"
                            value={formData.ownerPhone}
                            onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          We'll use the hotel phone if not provided
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ownerPassword">Password *</Label>
                          <Input
                            id="ownerPassword"
                            name="ownerPassword"
                            type="password"
                            data-testid="input-owner-password"
                            value={formData.ownerPassword}
                            onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                            required
                            placeholder="Min 6 characters"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            data-testid="input-confirm-password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            placeholder="Confirm password"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Monthly Subscription:</span>
                      <span className="text-xl font-bold text-gray-900">
                        ₹{selectedPlan.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Secure payment via Razorpay. Cancel anytime.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending || !selectedPlace}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-lg"
                    data-testid="button-submit-registration"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Complete Registration & Pay
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By continuing, you agree to our{" "}
                    <a href="/terms" className="text-blue-600 hover:underline">Terms</a> and{" "}
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
