import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Receipt, CreditCard, User, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CheckIn, Guest, Room } from "@shared/schema";

const checkoutSchema = z.object({
  actualCheckOutDate: z.string().min(1, "Checkout date is required"),
  actualCheckOutTime: z.string().min(1, "Checkout time is required"),
  guestGstNumber: z.string().optional(),
  additionalCharges: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutPageProps {
  checkInId?: string;
}

export default function Checkout({ checkInId }: CheckoutPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Get active check-ins for selection
  const { data: activeCheckIns = [] } = useQuery<(CheckIn & { guest: Guest; room: Room })[]>({
    queryKey: ["/api/checkins/active"],
  });

  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn & { guest: Guest; room: Room } | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      actualCheckOutDate: new Date().toISOString().split('T')[0],
      actualCheckOutTime: "11:00",
      guestGstNumber: "",
      additionalCharges: 0,
      discount: 0,
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutFormData & { checkInId: string }) => {
      return await apiRequest("POST", "/api/checkout", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/checkins/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics/rooms"] });
      
      toast({
        title: "Success",
        description: "Guest checked out successfully and invoice generated",
      });
      
      // Show invoice preview or redirect
      setShowInvoicePreview(true);
    },
    onError: (error: any) => {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Checkout failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    if (!selectedCheckIn) {
      toast({
        title: "Error",
        description: "Please select a guest to checkout",
        variant: "destructive",
      });
      return;
    }
    
    checkoutMutation.mutate({
      ...data,
      checkInId: selectedCheckIn.id,
    });
  };

  const calculateBill = () => {
    if (!selectedCheckIn) return { subtotal: 0, taxes: 0, total: 0 };
    
    const nights = Math.ceil(
      (new Date(form.watch("actualCheckOutDate")).getTime() - 
       new Date(selectedCheckIn.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    ) || 1;
    
    // Use the dynamic room rate from check-in, fallback to room's base price
    const roomRate = parseFloat(selectedCheckIn.roomRate || selectedCheckIn.room.basePrice || "0");
    const additionalCharges = form.watch("additionalCharges") || 0;
    const discount = form.watch("discount") || 0;
    
    const subtotal = (roomRate * nights) + additionalCharges - discount;
    // Use dynamic GST rates from check-in if available, otherwise default to 12%
    const cgstRate = parseFloat(selectedCheckIn.cgstRate || "6") / 100;
    const sgstRate = parseFloat(selectedCheckIn.sgstRate || "6") / 100;
    const taxes = subtotal * (cgstRate + sgstRate);
    const total = subtotal + taxes;
    
    return { subtotal, taxes, total, nights, roomRate };
  };

  const bill = calculateBill();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Receipt className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Guest Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guest Selection & Checkout Form */}
        <div className="space-y-6">
          {/* Active Guests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Select Guest to Checkout</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCheckIns.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active check-ins found</p>
              ) : (
                activeCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCheckIn?.id === checkIn.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedCheckIn(checkIn)}
                    data-testid={`guest-${checkIn.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{checkIn.guest.fullName}</h3>
                        <p className="text-sm text-gray-600">Room {checkIn.room.number}</p>
                        <p className="text-sm text-gray-500">
                          Checked in: {new Date(checkIn.checkInDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={checkIn.room.type === "suite" ? "default" : "secondary"}>
                          {checkIn.room.type}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          ₹{checkIn.room.basePrice}/night
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Checkout Form */}
          {selectedCheckIn && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Checkout Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="actualCheckOutDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Checkout Date <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-checkout-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="actualCheckOutTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Checkout Time <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="time" {...field} data-testid="input-checkout-time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="guestGstNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest GST Number (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter 15-digit GST number for business guests" 
                              maxLength={15}
                              {...field} 
                              data-testid="input-guest-gst"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="additionalCharges"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Charges (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-additional-charges"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-discount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bill Preview */}
        {selectedCheckIn && (
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Bill Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Room Rate (₹{bill.roomRate || 0}/night)</span>
                  <span>× {bill.nights || 1} nights</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{((bill.roomRate || 0) * (bill.nights || 1)).toFixed(2)}</span>
                </div>
                {form.watch("additionalCharges") > 0 && (
                  <div className="flex justify-between">
                    <span>Additional Charges</span>
                    <span>₹{form.watch("additionalCharges").toFixed(2)}</span>
                  </div>
                )}
                {form.watch("discount") > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{form.watch("discount").toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between">
                  <span>Net Amount</span>
                  <span>₹{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CGST ({parseFloat(selectedCheckIn.cgstRate || "6").toFixed(1)}%)</span>
                  <span>₹{(bill.subtotal * parseFloat(selectedCheckIn.cgstRate || "6") / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST ({parseFloat(selectedCheckIn.sgstRate || "6").toFixed(1)}%)</span>
                  <span>₹{(bill.subtotal * parseFloat(selectedCheckIn.sgstRate || "6") / 100).toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span>₹{bill.total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={checkoutMutation.isPending || !selectedCheckIn}
                className="w-full"
                data-testid="button-checkout"
              >
                {checkoutMutation.isPending ? "Processing..." : "Complete Checkout & Generate Invoice"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="w-full"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}