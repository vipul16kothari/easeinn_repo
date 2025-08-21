import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Minus, ArrowLeft, Users, IndianRupee } from "lucide-react";

const roomSchema = z.object({
  roomType: z.enum(["standard", "deluxe", "suite"]),
  roomNumber: z.string().optional(),
  roomRate: z.number().min(0),
});

const multiRoomBookingSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  guestPhone: z.string().min(10, "Valid phone number is required"),
  guestEmail: z.string().email().optional().or(z.literal("")),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  advanceAmount: z.number().min(0).default(0),
  specialRequests: z.string().optional(),
  rooms: z.array(roomSchema).min(1, "At least one room is required"),
});

type MultiRoomBookingForm = z.infer<typeof multiRoomBookingSchema>;

const roomTypeRates = {
  standard: 2000,
  deluxe: 3500,
  suite: 5000,
};

export default function MultiRoomBooking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MultiRoomBookingForm>({
    resolver: zodResolver(multiRoomBookingSchema),
    defaultValues: {
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      checkInDate: "",
      checkOutDate: "",
      advanceAmount: 0,
      specialRequests: "",
      rooms: [{ roomType: "deluxe", roomNumber: "", roomRate: roomTypeRates.deluxe }],
    },
  });

  const createMultiRoomBookingMutation = useMutation({
    mutationFn: async (data: MultiRoomBookingForm) => {
      // Calculate total amount based on stay duration and room rates
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      
      const totalAmount = data.rooms.reduce((sum, room) => sum + (room.roomRate * nights), 0);

      const response = await fetch("/api/bookings/multi-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          totalAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create multi-room booking");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Multi-room booking created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setLocation("/bookings");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MultiRoomBookingForm) => {
    // Validate dates
    const checkInDate = new Date(data.checkInDate);
    const checkOutDate = new Date(data.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      toast({
        title: "Invalid Date",
        description: "Check-in date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (checkOutDate <= checkInDate) {
      toast({
        title: "Invalid Date",
        description: "Check-out date must be after check-in date",
        variant: "destructive",
      });
      return;
    }

    createMultiRoomBookingMutation.mutate(data);
  };

  const addRoom = () => {
    const currentRooms = form.getValues("rooms");
    form.setValue("rooms", [
      ...currentRooms,
      { roomType: "deluxe", roomNumber: "", roomRate: roomTypeRates.deluxe },
    ]);
  };

  const removeRoom = (index: number) => {
    const currentRooms = form.getValues("rooms");
    if (currentRooms.length > 1) {
      form.setValue("rooms", currentRooms.filter((_, i) => i !== index));
    }
  };

  const updateRoomType = (index: number, roomType: "standard" | "deluxe" | "suite") => {
    const currentRooms = form.getValues("rooms");
    currentRooms[index] = {
      ...currentRooms[index],
      roomType,
      roomRate: roomTypeRates[roomType],
    };
    form.setValue("rooms", currentRooms);
  };

  const updateRoomRate = (index: number, rate: number) => {
    const currentRooms = form.getValues("rooms");
    currentRooms[index].roomRate = rate;
    form.setValue("rooms", currentRooms);
  };

  const updateRoomNumber = (index: number, roomNumber: string) => {
    const currentRooms = form.getValues("rooms");
    currentRooms[index].roomNumber = roomNumber;
    form.setValue("rooms", currentRooms);
  };

  const calculateTotalAmount = () => {
    const checkInDate = form.watch("checkInDate");
    const checkOutDate = form.watch("checkOutDate");
    const rooms = form.watch("rooms");

    if (!checkInDate || !checkOutDate) return 0;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    return rooms.reduce((sum, room) => sum + (room.roomRate * nights), 0);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/bookings")}
          className="mb-4"
          data-testid="button-back-to-bookings"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
        
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Multi-Room Booking</h1>
            <p className="text-gray-600">Book multiple rooms with individual pricing</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
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
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="guest@example.com" {...field} data-testid="input-guest-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Booking Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Dates</CardTitle>
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

          {/* Room Configuration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Room Configuration</CardTitle>
              <Button
                type="button"
                onClick={addRoom}
                variant="outline"
                size="sm"
                data-testid="button-add-room"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.watch("rooms").map((room, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gray-50 space-y-4"
                  data-testid={`room-config-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Room {index + 1}</h4>
                    {form.watch("rooms").length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeRoom(index)}
                        variant="destructive"
                        size="sm"
                        data-testid={`button-remove-room-${index}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Room Type <span className="text-red-500">*</span></label>
                      <Select
                        value={room.roomType}
                        onValueChange={(value: "standard" | "deluxe" | "suite") => updateRoomType(index, value)}
                      >
                        <SelectTrigger data-testid={`select-room-type-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard (₹{roomTypeRates.standard}/night)</SelectItem>
                          <SelectItem value="deluxe">Deluxe (₹{roomTypeRates.deluxe}/night)</SelectItem>
                          <SelectItem value="suite">Suite (₹{roomTypeRates.suite}/night)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Room Number (Optional)</label>
                      <Input
                        placeholder="e.g., 101, 205"
                        value={room.roomNumber || ""}
                        onChange={(e) => updateRoomNumber(index, e.target.value)}
                        data-testid={`input-room-number-${index}`}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Rate per Night (₹) <span className="text-red-500">*</span></label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={room.roomRate}
                        onChange={(e) => updateRoomRate(index, parseFloat(e.target.value) || 0)}
                        data-testid={`input-room-rate-${index}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <Input placeholder="Any special requirements..." {...field} data-testid="input-special-requests" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Total Amount Display */}
          {calculateTotalAmount() > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Total Booking Amount:</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">
                    ₹{calculateTotalAmount().toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {form.watch("checkInDate") && form.watch("checkOutDate") && (
                    <>
                      {Math.max(1, Math.ceil((new Date(form.watch("checkOutDate")).getTime() - new Date(form.watch("checkInDate")).getTime()) / (1000 * 60 * 60 * 24)))} nights × {form.watch("rooms").length} rooms
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/bookings")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMultiRoomBookingMutation.isPending}
              data-testid="button-create-multi-room-booking"
            >
              {createMultiRoomBookingMutation.isPending ? "Creating..." : "Create Multi-Room Booking"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}