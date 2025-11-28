import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { CheckCircle, Hotel, MapPin, Phone, Mail, User, Calendar, Users, FileText, Loader2, Upload, X } from "lucide-react";

const guestCheckInSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  numberOfMales: z.coerce.number().min(0).default(0),
  numberOfFemales: z.coerce.number().min(0).default(0),
  numberOfChildren: z.coerce.number().min(0).default(0),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().optional(),
  preferredRoomType: z.string().optional(),
  documentType: z.string().optional(),
  documentImage: z.string().optional(),
  comingFrom: z.string().min(2, "City/Place is required"),
  nationality: z.string().min(2, "Nationality is required"),
  purposeOfVisit: z.enum(["business", "leisure", "conference", "wedding", "other"]).optional(),
  specialRequests: z.string().optional()
});

type GuestCheckInFormData = z.infer<typeof guestCheckInSchema>;

interface HotelInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  selfCheckInEnabled: boolean;
}

interface RoomTypeInfo {
  type: string;
  available: number;
}

export default function GuestCheckIn() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: hotelInfo, isLoading: hotelLoading, error: hotelError } = useQuery<HotelInfo>({
    queryKey: ['/api/public/hotel', slug],
    queryFn: async () => {
      const response = await fetch(`/api/public/hotel/${slug}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Hotel not found");
      }
      return response.json();
    },
    enabled: !!slug
  });

  const { data: roomTypesData } = useQuery<{ roomTypes: RoomTypeInfo[] }>({
    queryKey: ['/api/public/hotel', slug, 'room-types'],
    queryFn: async () => {
      const response = await fetch(`/api/public/hotel/${slug}/room-types`);
      if (!response.ok) {
        return { roomTypes: [] };
      }
      return response.json();
    },
    enabled: !!slug && !!hotelInfo
  });

  useEffect(() => {
    if (hotelInfo) {
      document.title = `Self Check-In - ${hotelInfo.name}`;
    } else {
      document.title = "Guest Self Check-In";
    }
  }, [hotelInfo]);

  const form = useForm<GuestCheckInFormData>({
    resolver: zodResolver(guestCheckInSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      numberOfMales: 1,
      numberOfFemales: 0,
      numberOfChildren: 0,
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: "",
      preferredRoomType: "",
      documentType: "",
      documentImage: "",
      comingFrom: "",
      nationality: "Indian",
      purposeOfVisit: undefined,
      specialRequests: ""
    }
  });

  const males = form.watch("numberOfMales") || 0;
  const females = form.watch("numberOfFemales") || 0;
  const children = form.watch("numberOfChildren") || 0;
  const totalGuests = males + females + children;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG, JPEG, or PDF file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      form.setValue("documentImage", base64);
      setDocumentPreview(file.type.startsWith('image/') ? base64 : null);
      setDocumentFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = () => {
    form.setValue("documentImage", "");
    setDocumentPreview(null);
    setDocumentFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: GuestCheckInFormData) => {
      const numberOfGuests = (data.numberOfMales || 0) + (data.numberOfFemales || 0) + (data.numberOfChildren || 0);
      if (numberOfGuests < 1) {
        throw new Error("At least one guest is required");
      }
      
      const response = await fetch(`/api/public/hotel/${slug}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          numberOfGuests
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit check-in request");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setRequestId(data.requestId);
      setSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "Your check-in request has been submitted. The hotel staff will process it shortly."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit check-in request",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: GuestCheckInFormData) => {
    submitMutation.mutate(data);
  };

  if (hotelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading hotel information...</p>
        </div>
      </div>
    );
  }

  if (hotelError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Hotel className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Hotel Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {(hotelError as Error).message || "The hotel you're looking for is not available or doesn't accept online check-ins."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Request Submitted!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your check-in request has been submitted to <span className="font-semibold">{hotelInfo?.name}</span>.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Your Request ID</p>
                <p className="font-mono text-lg font-semibold">{requestId?.substring(0, 8).toUpperCase()}</p>
              </div>
              <p className="text-sm text-gray-500">
                The hotel staff will review your request and assign a room. You will be contacted on your provided phone number.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Hotel Header */}
        <Card className="mb-6 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                {hotelInfo?.logo ? (
                  <img src={hotelInfo.logo} alt={hotelInfo.name} className="h-12 w-12 object-contain" />
                ) : (
                  <Hotel className="h-8 w-8 text-purple-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{hotelInfo?.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hotelInfo?.address}, {hotelInfo?.city}, {hotelInfo?.state}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Self Check-In Request
            </CardTitle>
            <CardDescription>
              Fill in your details below. The hotel staff will process your request and assign a room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4" /> Personal Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} data-testid="input-fullname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email" type="email" {...field} data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="comingFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coming From (City/Place) *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city or place" {...field} data-testid="input-coming-from" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter nationality" {...field} data-testid="input-nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Guest Count */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Number of Guests
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="numberOfMales"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Males *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-males" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfFemales"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Females</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-females" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfChildren"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Children</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-children" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Total Guests
                      </label>
                      <div className="mt-2 h-10 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center font-semibold text-lg" data-testid="display-total-guests">
                        {totalGuests || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Stay Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="checkInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Check-in Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-checkin-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="checkOutDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Check-out Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-checkout-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roomTypesData?.roomTypes && roomTypesData.roomTypes.length > 0 && (
                      <FormField
                        control={form.control}
                        name="preferredRoomType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Room Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-room-type">
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roomTypesData.roomTypes.map((rt) => (
                                  <SelectItem key={rt.type} value={rt.type}>
                                    {rt.type.charAt(0).toUpperCase() + rt.type.slice(1)} ({rt.available} available)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="purposeOfVisit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose of Visit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-purpose">
                                <SelectValue placeholder="Select purpose" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="leisure">Leisure / Tourism</SelectItem>
                              <SelectItem value="conference">Conference / Event</SelectItem>
                              <SelectItem value="wedding">Wedding / Function</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* ID Document */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> ID Document (Optional)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-doc-type">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="aadhar">Aadhar Card</SelectItem>
                              <SelectItem value="pan">PAN Card</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="driving_license">Driving License</SelectItem>
                              <SelectItem value="voter_id">Voter ID</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <label className="text-sm font-medium leading-none mb-2 block">
                        Upload Document
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".png,.jpg,.jpeg,.pdf"
                        className="hidden"
                        data-testid="input-doc-file"
                      />
                      {!documentFileName ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-upload-doc"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File (PNG, JPEG, PDF)
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                          {documentPreview ? (
                            <img src={documentPreview} alt="Document" className="h-8 w-8 object-cover rounded" />
                          ) : (
                            <FileText className="h-8 w-8 text-green-600" />
                          )}
                          <span className="flex-1 text-sm truncate text-green-700 dark:text-green-400">{documentFileName}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700"
                            onClick={removeDocument}
                            data-testid="button-remove-doc"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Max 5MB. PNG, JPEG, or PDF</p>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special requests or requirements..."
                          className="min-h-[80px]"
                          {...field}
                          data-testid="input-special-requests"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-checkin"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Check-In Request"
                  )}
                </Button>

                <p className="text-sm text-center text-gray-500">
                  By submitting, you agree to provide accurate information for your stay.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by <span className="font-semibold text-purple-600">EaseInn</span></p>
        </div>
      </div>
    </div>
  );
}
