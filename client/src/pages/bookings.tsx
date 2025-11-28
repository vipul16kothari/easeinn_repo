import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Calendar, Phone, Mail, Users, IndianRupee, LogIn, DoorOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Booking, Room } from "@shared/schema";

const bookingSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  guestPhone: z.string().min(10, "Valid phone number is required"),
  guestEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  roomType: z.enum(["standard", "deluxe", "suite"]),
  roomNumber: z.string().optional(),
  numberOfRooms: z.number().min(1, "At least 1 room required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  roomRate: z.number().min(0, "Room rate must be positive"),
  advanceAmount: z.number().min(0, "Advance amount must be positive").optional(),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [documentType, setDocumentType] = useState("aadhar");
  const [documentNumber, setDocumentNumber] = useState("");

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: availableRooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms/available"],
    enabled: isCheckInDialogOpen,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      roomType: "standard",
      roomNumber: "",
      numberOfRooms: 1,
      checkInDate: "",
      checkOutDate: "",
      roomRate: 0,
      advanceAmount: 0,
      specialRequests: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingFormData) => {
      // Validate check-in date is not in the past for advance bookings
      const today = new Date();
      const checkInDate = new Date(bookingData.checkInDate);
      today.setHours(0, 0, 0, 0);
      checkInDate.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        throw new Error("Check-in date cannot be in the past. For same-day check-ins, use the Check-in section.");
      }
      
      const payload = {
        ...bookingData,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
        roomRate: bookingData.roomRate.toString(),
        advanceAmount: (bookingData.advanceAmount || 0).toString(),
        totalAmount: calculateTotal().toString(),
      };
      return await apiRequest("POST", "/api/bookings", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Booking created",
        description: "Advance booking has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking updated",
        description: "Booking status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkInFromBookingMutation = useMutation({
    mutationFn: async ({ bookingId, roomId, documentType, documentNumber }: { 
      bookingId: string; 
      roomId: string; 
      documentType: string;
      documentNumber: string;
    }) => {
      return await apiRequest("POST", `/api/bookings/${bookingId}/checkin`, { 
        roomId, 
        documentType, 
        documentNumber 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checkins/active"] });
      setIsCheckInDialogOpen(false);
      setSelectedBooking(null);
      setSelectedRoomId("");
      setDocumentNumber("");
      toast({
        title: "Check-in successful",
        description: "The guest has been checked in successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in failed",
        description: error.message || "Failed to check in guest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCheckInFromBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsCheckInDialogOpen(true);
  };

  const handleConfirmCheckIn = () => {
    if (!selectedBooking || !selectedRoomId) {
      toast({
        title: "Error",
        description: "Please select a room for check-in.",
        variant: "destructive",
      });
      return;
    }
    checkInFromBookingMutation.mutate({
      bookingId: selectedBooking.id,
      roomId: selectedRoomId,
      documentType,
      documentNumber,
    });
  };

  const calculateTotal = () => {
    const checkIn = form.watch("checkInDate");
    const checkOut = form.watch("checkOutDate");
    const roomRate = form.watch("roomRate") || 0;
    const numberOfRooms = form.watch("numberOfRooms") || 1;

    if (!checkIn || !checkOut) return 0;

    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ) || 1;

    return roomRate * nights * numberOfRooms;
  };

  const onSubmit = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const handleStatusChange = (booking: Booking, newStatus: string) => {
    updateBookingStatusMutation.mutate({ id: booking.id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "text-green-600 bg-green-50 border-green-200";
      case "cancelled": return "text-red-600 bg-red-50 border-red-200";
      case "checked_in": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRoomTypeIcon = (type: string) => {
    return <Calendar className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advance Bookings</h1>
          <p className="text-gray-600 mt-1">Manage future reservations and advance bookings</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-booking">
                <Plus className="h-4 w-4 mr-2" />
                Add Booking
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Advance Booking</DialogTitle>
              <DialogDescription>
                Add a new advance booking for future check-in.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Guest Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guest Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter guest name" {...field} data-testid="input-guest-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guestPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="+91-9876543210" {...field} data-testid="input-guest-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="guestEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="guest@example.com" {...field} data-testid="input-guest-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Room Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-room-type">
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="deluxe">Deluxe</SelectItem>
                            <SelectItem value="suite">Suite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roomNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 101, 205" {...field} data-testid="input-room-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Rooms <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || value === "0") {
                                field.onChange(1);
                              } else {
                                field.onChange(parseInt(value) || 1);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            data-testid="input-number-rooms"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roomRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Rate per Night (₹) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                field.onChange(0);
                              } else {
                                field.onChange(parseFloat(value) || 0);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            data-testid="input-room-rate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Booking Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Date <span className="text-red-500">*</span></FormLabel>
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
                        <FormLabel>Check-out Date <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-checkout-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="advanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(0);
                            } else {
                              field.onChange(parseFloat(value) || 0);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          data-testid="input-advance-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests</FormLabel>
                      <FormControl>
                        <Input placeholder="Any special requirements..." {...field} data-testid="input-special-requests" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Total Amount Display */}
                {calculateTotal() > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createBookingMutation.isPending}
                    data-testid="button-create-booking"
                  >
                    {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No advance bookings found</h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by adding your first advance booking for future guests.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-booking">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Booking
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking: Booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getRoomTypeIcon(booking.roomType || "standard")}
                    <CardTitle className="text-lg">{booking.guestName}</CardTitle>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.bookingStatus)}`}>
                    {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{booking.guestPhone}</span>
                  </div>
                  {booking.guestEmail && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{booking.guestEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{booking.numberOfRooms} {booking.roomType} room(s)</span>
                  </div>
                  {booking.roomNumber && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Room {booking.roomNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span>₹{parseFloat(booking.roomRate || "0").toFixed(0)}/night</span>
                  </div>
                  {booking.advanceAmount && parseFloat(booking.advanceAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Advance:</span>
                      <span className="font-medium text-green-600">₹{parseFloat(booking.advanceAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">₹{parseFloat(booking.totalAmount || "0").toFixed(2)}</span>
                  </div>
                </div>

                {booking.bookingStatus === "confirmed" && (
                  <div className="pt-2 flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => handleCheckInFromBooking(booking)}
                      data-testid={`button-checkin-${booking.id}`}
                    >
                      <DoorOpen className="h-4 w-4 mr-1" />
                      Check-In
                    </Button>
                    <Select
                      value={booking.bookingStatus}
                      onValueChange={(value) => handleStatusChange(booking, value)}
                      disabled={updateBookingStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-24" data-testid={`select-status-${booking.id}`}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Check-In from Booking Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={(open) => {
        setIsCheckInDialogOpen(open);
        if (!open) {
          setSelectedBooking(null);
          setSelectedRoomId("");
          setDocumentNumber("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check-In Guest</DialogTitle>
            <DialogDescription>
              Convert this booking to an active check-in by assigning a room.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Guest Name</span>
                  <span className="font-medium">{selectedBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone</span>
                  <span>{selectedBooking.guestPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Check-In Date</span>
                  <span>{new Date(selectedBooking.checkInDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Check-Out Date</span>
                  <span>{new Date(selectedBooking.checkOutDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Room Type</span>
                  <span className="capitalize">{selectedBooking.roomType}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Room <span className="text-red-500">*</span></Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger data-testid="select-room-for-checkin">
                    <SelectValue placeholder="Choose an available room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.filter(room => 
                      room.type === selectedBooking.roomType || !selectedBooking.roomType
                    ).map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.number} - {room.type} (₹{room.basePrice}/night)
                      </SelectItem>
                    ))}
                    {availableRooms.filter(room => 
                      room.type === selectedBooking.roomType || !selectedBooking.roomType
                    ).length === 0 && (
                      <SelectItem value="no-rooms" disabled>
                        No matching rooms available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aadhar">Aadhar Card</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem>
                      <SelectItem value="voter_id">Voter ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Document Number</Label>
                  <Input 
                    value={documentNumber} 
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Enter number"
                    data-testid="input-document-number"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCheckInDialogOpen(false)}
              data-testid="button-cancel-checkin"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmCheckIn}
              disabled={checkInFromBookingMutation.isPending || !selectedRoomId}
              data-testid="button-confirm-checkin"
            >
              {checkInFromBookingMutation.isPending ? "Processing..." : "Confirm Check-In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}