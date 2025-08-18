import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SignaturePad from "@/components/signature-pad";
import { insertGuestSchema, insertCheckInSchema, Room } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const checkInFormSchema = insertGuestSchema.extend({
  roomId: z.string().min(1, "Room selection is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkInTime: z.string().min(1, "Check-in time is required"),
}).extend({
  signature: z.string().nullable().optional(),
});

type CheckInFormData = z.infer<typeof checkInFormSchema>;

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CheckInFormData>({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      comingFrom: "",
      nationality: "",
      numberOfMales: 0,
      numberOfFemales: 0,
      numberOfChildren: 0,
      purposeOfVisit: undefined,
      destination: "",
      signature: null,
      roomId: "",
      checkInDate: new Date().toISOString().split('T')[0],
      checkInTime: "15:00",
    },
  });

  const { data: availableRooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms/available"],
  });

  const completeCheckInMutation = useMutation({
    mutationFn: async (data: CheckInFormData) => {
      const { roomId, checkInDate, checkInTime, signature, ...guestData } = data;
      
      const checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);
      
      const payload = {
        guest: { ...guestData, signature },
        checkIn: {
          roomId,
          checkInDate: checkInDateTime.toISOString(),
          checkInTime,
        }
      };

      const response = await apiRequest("POST", "/api/complete-checkin", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/rooms"] });
      
      toast({
        title: "Success",
        description: "Guest check-in completed successfully",
      });
      
      form.reset();
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete check-in",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckInFormData) => {
    completeCheckInMutation.mutate(data);
  };

  const saveDraft = () => {
    // Save form data to localStorage
    localStorage.setItem("checkInDraft", JSON.stringify(form.getValues()));
    toast({
      title: "Draft Saved",
      description: "Your check-in form has been saved as a draft",
    });
  };

  const countries = [
    "United States", "Canada", "United Kingdom", "Germany", "France", "India", "Australia",
    "Brazil", "China", "Japan", "Mexico", "Italy", "Spain", "Netherlands", "Sweden"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="checkin-container">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900" data-testid="checkin-title">
            Guest Check-in
          </h2>
          <p className="text-sm text-gray-600 mt-1">Complete guest registration and room assignment</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter guest's full name"
                          {...field}
                          data-testid="input-full-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (WhatsApp) <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="pl-12"
                            {...field}
                            data-testid="input-phone"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="fab fa-whatsapp text-green-500"></i>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter complete address"
                            rows={3}
                            {...field}
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="comingFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Where they came from <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City/Location"
                          {...field}
                          data-testid="input-coming-from"
                        />
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
                      <FormLabel>Nationality <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} data-testid="select-nationality">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Check-in Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Check-in Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  name="checkInTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in Time <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-checkin-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} data-testid="select-room">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select available room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.number} - {room.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Guest Count */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Guest Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="numberOfMales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Males</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
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
                      <FormLabel>Number of Females</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
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
                      <FormLabel>Number of Children</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-children"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Visit Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-4">Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="purposeOfVisit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Visit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} data-testid="select-purpose">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="leisure">Leisure</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination/Going Back To</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City/Location"
                          {...field}
                          data-testid="input-destination"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Digital Signature */}
            <FormField
              control={form.control}
              name="signature"
              render={({ field }) => (
                <FormItem>
                  <SignaturePad
                    onSignatureChange={field.onChange}
                    signature={field.value}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={completeCheckInMutation.isPending}
                className="w-full sm:w-auto bg-primary-600 text-white hover:bg-primary-700"
                data-testid="button-complete-checkin"
              >
                <i className="fas fa-check mr-2"></i>
                {completeCheckInMutation.isPending ? "Processing..." : "Complete Check-in"}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={saveDraft}
                className="w-full sm:w-auto"
                data-testid="button-save-draft"
              >
                <i className="fas fa-save mr-2"></i>Save Draft
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="w-full sm:w-auto"
                data-testid="button-cancel"
              >
                <i className="fas fa-times mr-2"></i>Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
