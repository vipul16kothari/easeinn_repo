import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Calendar, Users, IndianRupee } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const roomSchema = z.object({
  roomType: z.enum(["standard", "deluxe", "suite"]),
  roomNumber: z.string().optional(),
  roomRate: z.number().min(0, "Room rate must be positive"),
});

const multiRoomBookingSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  guestPhone: z.string().min(10, "Valid phone number is required"),
  guestEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  rooms: z.array(roomSchema).min(1, "At least one room is required"),
  advanceAmount: z.number().min(0, "Advance amount must be positive").optional(),
  specialRequests: z.string().optional(),
});

type MultiRoomBookingFormData = z.infer<typeof multiRoomBookingSchema>;

export default function MultiRoomBookingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<MultiRoomBookingFormData>({
    resolver: zodResolver(multiRoomBookingSchema),
    defaultValues: {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      checkInDate: "",
      checkOutDate: "",
      rooms: [{ roomType: "standard", roomNumber: "", roomRate: 0 }],
      advanceAmount: 0,
      specialRequests: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms",
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: MultiRoomBookingFormData) => {
      // Validate check-in date is not in the past for advance bookings
      const today = new Date();
      const checkInDate = new Date(bookingData.checkInDate);
      today.setHours(0, 0, 0, 0);
      checkInDate.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        throw new Error("Check-in date cannot be in the past. For same-day check-ins, use the Check-in section.");
      }

      // Calculate total amount
      const subtotal = bookingData.rooms.reduce((sum, room) => sum + room.roomRate, 0);
      const nights = Math.ceil((new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = subtotal * nights;
      
      const payload = {
        guestName: bookingData.guestName,
        guestPhone: bookingData.guestPhone,
        guestEmail: bookingData.guestEmail || undefined,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
        advanceAmount: (bookingData.advanceAmount || 0).toString(),
        totalAmount: totalAmount.toString(),
        specialRequests: bookingData.specialRequests,
        rooms: bookingData.rooms.map(room => ({
          roomType: room.roomType,
          roomNumber: room.roomNumber || undefined,
          roomRate: room.roomRate.toString(),
        })),
      };

      return await apiRequest("POST", "/api/bookings/multi-room", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      
      toast({
        title: "Success",
        description: "Multi-room booking created successfully",
      });
      
      form.reset();
      setLocation("/bookings");
    },
    onError: (error: any) => {
      console.error("Booking error:", error);
      let errorMessage = "Failed to create booking";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MultiRoomBookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const addRoom = () => {
    append({ roomType: "standard", roomNumber: "", roomRate: 0 });
  };

  const removeRoom = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const calculateTotal = () => {
    const rooms = form.watch("rooms");
    const checkInDate = form.watch("checkInDate");
    const checkOutDate = form.watch("checkOutDate");
    
    if (!checkInDate || !checkOutDate) return 0;
    
    const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
    const subtotal = rooms.reduce((sum, room) => sum + (room.roomRate || 0), 0);
    
    return subtotal * nights;
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "suite": return "bg-purple-100 text-purple-800";
      case "deluxe": return "bg-blue-100 text-blue-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="multi-room-booking-container">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Multi-Room Booking</h1>
          <p className="text-sm text-gray-600 mt-1">Book multiple rooms with individual pricing</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guest Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} data-testid="input-guest-name" />
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
                          <Input placeholder="Phone number" {...field} data-testid="input-guest-phone" />
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
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Email address" {...field} data-testid="input-guest-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Stay Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stay Dates</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Rooms Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Room Configuration
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRoom}
                    data-testid="button-add-room"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoomTypeColor(form.watch(`rooms.${index}.roomType`))}>
                          Room {index + 1}
                        </Badge>
                        <span className="text-sm text-gray-600 capitalize">
                          {form.watch(`rooms.${index}.roomType`)}
                        </span>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRoom(index)}
                          data-testid={`button-remove-room-${index}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`rooms.${index}.roomType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Type <span className="text-red-500">*</span></FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid={`select-room-type-${index}`}>
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="standard">Standard - ₹1500/night</SelectItem>
                                <SelectItem value="deluxe">Deluxe - ₹2500/night</SelectItem>
                                <SelectItem value="suite">Suite - ₹4000/night</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`rooms.${index}.roomNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 101, 205" {...field} data-testid={`input-room-number-${index}`} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`rooms.${index}.roomRate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate per Night <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid={`input-room-rate-${index}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="advanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        <Textarea
                          placeholder="Any special requirements or requests..."
                          {...field}
                          data-testid="textarea-special-requests"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Rooms:</span>
                    <span className="font-medium">{fields.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Per Night Subtotal:</span>
                    <span className="font-medium">₹{form.watch("rooms").reduce((sum, room) => sum + (room.roomRate || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={createBookingMutation.isPending}
                className="flex-1"
                data-testid="button-create-booking"
              >
                {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/bookings")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}