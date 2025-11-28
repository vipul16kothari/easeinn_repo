import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Search, 
  Building2, 
  MapPin, 
  Star, 
  Globe, 
  Phone, 
  Loader2, 
  CheckCircle,
  ArrowRight,
  Edit3,
  RefreshCw,
  LogOut
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh"
];

const CITIES_BY_STATE: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur"],
  "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum", "Udupi", "Hampi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli", "Ooty"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Munnar", "Alleppey"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Dwarka"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer", "Pushkar", "Mount Abu", "Bikaner"],
  "Delhi": ["New Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Calangute", "Candolim"],
  "Uttar Pradesh": ["Agra", "Varanasi", "Lucknow", "Noida", "Ghaziabad", "Mathura", "Allahabad"],
  "West Bengal": ["Kolkata", "Darjeeling", "Siliguri", "Howrah", "Durgapur", "Asansol"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Tirupati", "Guntur", "Nellore"],
  "Punjab": ["Amritsar", "Chandigarh", "Ludhiana", "Jalandhar", "Patiala"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu", "Dalhousie"],
  "Uttarakhand": ["Dehradun", "Rishikesh", "Haridwar", "Nainital", "Mussoorie"],
};

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
  photoUrl: string;
}

type Step = "search" | "results" | "manual";

declare global {
  interface Window {
    google: any;
    initPlacesAutocomplete: () => void;
  }
}

export default function PropertyDiscovery() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("search");
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceDetails[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  
  const [searchForm, setSearchForm] = useState({
    propertyName: "",
    state: "",
    city: ""
  });
  
  const [manualForm, setManualForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    pincode: ""
  });
  
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);

  const { data: authData, isLoading: authLoading, isError: authError } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  }) as { data: { user: any; hotel: any; hotels?: any[] } | undefined; isLoading: boolean; isError: boolean };

  useEffect(() => {
    if (!authLoading) {
      if (authError || !authData?.user) {
        setLocation("/login");
        return;
      }
      
      if (authData?.hotels && authData.hotels.length > 0) {
        setLocation("/dashboard");
        return;
      }
    }
  }, [authData, authLoading, authError, setLocation]);

  useEffect(() => {
    document.title = "Find Your Property - EaseInn";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Find your property on EaseInn. Search online or enter details manually to get started with hotel management.');
    }
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

  const availableCities = searchForm.state ? (CITIES_BY_STATE[searchForm.state] || []) : [];

  const handleSearch = useCallback(() => {
    if (!searchForm.propertyName || !searchForm.state) {
      toast({
        title: "Missing Information",
        description: "Please enter property name and select state",
        variant: "destructive"
      });
      return;
    }

    if (!autocompleteServiceRef.current || !placesServiceRef.current) {
      toast({
        title: "Search Not Ready",
        description: "Please wait for search to initialize",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    const searchQuery = `${searchForm.propertyName} hotel ${searchForm.city || ""} ${searchForm.state} India`;
    
    const request = {
      input: searchQuery,
      types: ['lodging'],
      componentRestrictions: { country: 'in' },
      sessionToken: sessionTokenRef.current
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (predictions: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
        const detailPromises = predictions.slice(0, 5).map((prediction: any) => {
          return new Promise<PlaceDetails | null>((resolve) => {
            const detailRequest = {
              placeId: prediction.place_id,
              fields: [
                'place_id', 'name', 'formatted_address', 'formatted_phone_number',
                'website', 'rating', 'user_ratings_total', 'geometry',
                'address_components', 'types', 'photos'
              ],
              sessionToken: sessionTokenRef.current
            };

            placesServiceRef.current.getDetails(detailRequest, (place: any, detailStatus: any) => {
              if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                const addressComponents = place.address_components || [];
                let city = '', state = '', country = '', postalCode = '';
                
                addressComponents.forEach((component: any) => {
                  if (component.types.includes('locality')) city = component.long_name;
                  if (component.types.includes('administrative_area_level_1')) state = component.long_name;
                  if (component.types.includes('country')) country = component.long_name;
                  if (component.types.includes('postal_code')) postalCode = component.long_name;
                });

                const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 400 }) || '';

                resolve({
                  placeId: place.place_id,
                  name: place.name,
                  address: place.formatted_address,
                  phone: place.formatted_phone_number || '',
                  website: place.website || '',
                  rating: place.rating || 0,
                  reviewCount: place.user_ratings_total || 0,
                  latitude: place.geometry?.location?.lat() || 0,
                  longitude: place.geometry?.location?.lng() || 0,
                  city, state, country, postalCode,
                  types: place.types || [],
                  photoUrl
                });
              } else {
                resolve(null);
              }
            });
          });
        });

        Promise.all(detailPromises).then((results) => {
          const validResults = results.filter((r): r is PlaceDetails => r !== null);
          setSearchResults(validResults);
          setCurrentStep("results");
          setIsSearching(false);
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        });
      } else {
        setIsSearching(false);
        setSearchResults([]);
        setCurrentStep("results");
        toast({
          title: "No Results Found",
          description: "Try a different search or enter details manually",
        });
      }
    });
  }, [searchForm, toast]);

  const linkPropertyMutation = useMutation({
    mutationFn: async (data: { placeDetails?: PlaceDetails; manualDetails?: typeof manualForm }) => {
      const response = await apiRequest("POST", "/api/hotels/link-property", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Property Linked Successfully!",
        description: `${data.hotel.name} has been added to your account`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Link Property",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleConfirmSelection = () => {
    if (!selectedPlace) return;
    linkPropertyMutation.mutate({ placeDetails: selectedPlace });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualForm.name || !manualForm.address || !manualForm.state || !manualForm.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    linkPropertyMutation.mutate({ manualDetails: manualForm });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.clear();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { id: "search", label: "Search", active: currentStep === "search" },
      { id: "results", label: "Property Details", active: currentStep === "results" || currentStep === "manual" },
      { id: "dashboard", label: "Dashboard", active: false }
    ];

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
              step.active ? 'bg-purple-600 text-white' : 
              index < steps.findIndex(s => s.active) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {index < steps.findIndex(s => s.active) ? <CheckCircle className="w-5 h-5" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm ${step.active ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-16 h-1 mx-4 rounded ${
                index < steps.findIndex(s => s.active) ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSearchStep = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Find Your Property</CardTitle>
        <p className="text-gray-600">Search online or enter details manually</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="propertyName" className="text-base font-medium">
              Property Name *
            </Label>
            <Input
              id="propertyName"
              data-testid="input-property-name"
              value={searchForm.propertyName}
              onChange={(e) => setSearchForm({ ...searchForm, propertyName: e.target.value })}
              placeholder="e.g., Hotel DigiStay"
              className="mt-2 h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state" className="text-base font-medium">
                State *
              </Label>
              <Select
                value={searchForm.state}
                onValueChange={(value) => setSearchForm({ ...searchForm, state: value, city: "" })}
              >
                <SelectTrigger className="mt-2 h-12" data-testid="select-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city" className="text-base font-medium">
                City
              </Label>
              <Select
                value={searchForm.city}
                onValueChange={(value) => setSearchForm({ ...searchForm, city: value })}
                disabled={!searchForm.state}
              >
                <SelectTrigger className="mt-2 h-12" data-testid="select-city">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSearch}
          disabled={isSearching || !placesLoaded}
          className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700"
          data-testid="button-search-online"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Search Online
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderResultsStep = () => (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Select Your Property</CardTitle>
          <p className="text-gray-600">
            {searchResults.length > 0 
              ? `${searchResults.length} match${searchResults.length > 1 ? 'es' : ''} found. Select yours to continue.`
              : "No properties found. Try searching again or enter manually."
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchResults.map((place) => (
            <div 
              key={place.placeId}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPlace?.placeId === place.placeId 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedPlace(place)}
              data-testid={`property-card-${place.placeId}`}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 mt-1">
                {selectedPlace?.placeId === place.placeId && (
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                )}
              </div>
              
              {place.photoUrl ? (
                <img 
                  src={place.photoUrl} 
                  alt={place.name}
                  className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-gray-900">{place.name}</h3>
                <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{place.address}</span>
                </p>
                {place.rating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-sm">{place.rating}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {selectedPlace && (
            <Button 
              onClick={handleConfirmSelection}
              disabled={linkPropertyMutation.isPending}
              className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700"
              data-testid="button-confirm-selection"
            >
              {linkPropertyMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Confirm Selection
            </Button>
          )}

          <div className="text-center text-gray-500 py-2">OR</div>

          <Button 
            variant="outline"
            onClick={() => {
              setCurrentStep("search");
              setSearchResults([]);
              setSelectedPlace(null);
            }}
            className="w-full h-12"
            data-testid="button-search-again"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Search Again
          </Button>

          <Button 
            variant="outline"
            onClick={() => setCurrentStep("manual")}
            className="w-full h-12"
            data-testid="button-enter-manually"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            None of these? Enter manually
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderManualStep = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Enter Property Details</CardTitle>
        <p className="text-gray-600">Fill in your property information manually</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <Label htmlFor="manualName">Property Name *</Label>
            <Input
              id="manualName"
              data-testid="input-manual-name"
              value={manualForm.name}
              onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
              placeholder="Enter property name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="manualAddress">Address *</Label>
            <Input
              id="manualAddress"
              data-testid="input-manual-address"
              value={manualForm.address}
              onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
              placeholder="Enter full address"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manualState">State *</Label>
              <Select
                value={manualForm.state}
                onValueChange={(value) => setManualForm({ ...manualForm, state: value, city: "" })}
              >
                <SelectTrigger className="mt-1" data-testid="select-manual-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="manualCity">City *</Label>
              <Input
                id="manualCity"
                data-testid="input-manual-city"
                value={manualForm.city}
                onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                placeholder="Enter city"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manualPhone">Phone</Label>
              <Input
                id="manualPhone"
                data-testid="input-manual-phone"
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                placeholder="Enter phone number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="manualPincode">Pincode</Label>
              <Input
                id="manualPincode"
                data-testid="input-manual-pincode"
                value={manualForm.pincode}
                onChange={(e) => setManualForm({ ...manualForm, pincode: e.target.value })}
                placeholder="Enter pincode"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="manualEmail">Email</Label>
            <Input
              id="manualEmail"
              type="email"
              data-testid="input-manual-email"
              value={manualForm.email}
              onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
              placeholder="Enter hotel email"
              className="mt-1"
            />
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              type="submit"
              disabled={linkPropertyMutation.isPending}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700"
              data-testid="button-submit-manual"
            >
              {linkPropertyMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 mr-2" />
              )}
              Continue to Dashboard
            </Button>

            <Button 
              type="button"
              variant="outline"
              onClick={() => setCurrentStep("search")}
              className="w-full h-12"
            >
              Back to Search
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50" data-testid="property-discovery-container">
      <header className="bg-white border-b py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8 text-purple-600" />
          <span className="text-2xl font-bold text-gray-900">EaseInn</span>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="text-gray-600" data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {renderProgressBar()}
        
        {currentStep === "search" && renderSearchStep()}
        {currentStep === "results" && renderResultsStep()}
        {currentStep === "manual" && renderManualStep()}
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        © 2025 EaseInn. All rights reserved.
      </footer>
    </div>
  );
}
