import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Receipt, Clock, CheckCircle, XCircle, IndianRupee } from "lucide-react";

interface Payment {
  id: string;
  amount: string;
  paymentType: string;
  description: string;
  paymentStatus: string;
  createdAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Payments() {
  const { toast } = useToast();
  const [razorpayKey, setRazorpayKey] = useState("");

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

  // Fetch payment history
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/payments/history"],
  });

  // Create subscription payment
  const subscriptionMutation = useMutation({
    mutationFn: async (data: { amount: number; planName: string }) => {
      return await apiRequest("POST", "/api/payments/subscription", data);
    },
    onSuccess: (order) => {
      handleRazorpayPayment(order, "subscription");
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    },
  });

  // Handle Razorpay payment
  const handleRazorpayPayment = (order: any, type: string) => {
    if (!window.Razorpay) {
      toast({
        title: "Payment Error",
        description: "Razorpay not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: "EaseInn",
      description: `Payment for ${type}`,
      order_id: order.id,
      handler: async (response: any) => {
        try {
          await apiRequest("POST", "/api/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully",
          });
          
          // Refresh payment history
          queryClient.invalidateQueries({ queryKey: ["/api/payments/history"] });
          
        } catch (error) {
          toast({
            title: "Payment Verification Failed",
            description: "Payment was completed but verification failed",
            variant: "destructive",
          });
        }
      },
      prefill: {
        name: "Hotel Owner",
        email: "owner@hotel.com",
      },
      theme: {
        color: "#7c3aed",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(parseFloat(amount));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">Manage subscriptions and payment history</p>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Basic Plan
            </CardTitle>
            <CardDescription>Perfect for small hotels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-4">
              ₹2,999/month
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Up to 25 rooms</li>
              <li>• Basic reporting</li>
              <li>• Email support</li>
              <li>• GST compliant invoicing</li>
            </ul>
            <Button
              onClick={() => subscriptionMutation.mutate({ amount: 2999, planName: "Basic Plan" })}
              disabled={subscriptionMutation.isPending}
              className="w-full"
            >
              {subscriptionMutation.isPending ? "Processing..." : "Subscribe Now"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 relative">
          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
            Popular
          </Badge>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Professional Plan
            </CardTitle>
            <CardDescription>Best for growing hotels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              ₹5,999/month
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Up to 100 rooms</li>
              <li>• Advanced analytics</li>
              <li>• Priority support</li>
              <li>• Multi-property management</li>
              <li>• Custom integrations</li>
            </ul>
            <Button
              onClick={() => subscriptionMutation.mutate({ amount: 5999, planName: "Professional Plan" })}
              disabled={subscriptionMutation.isPending}
              className="w-full"
            >
              {subscriptionMutation.isPending ? "Processing..." : "Subscribe Now"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-gold-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-600" />
              Enterprise Plan
            </CardTitle>
            <CardDescription>For large hotel chains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-4">
              ₹12,999/month
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li>• Unlimited rooms</li>
              <li>• Real-time analytics</li>
              <li>• 24/7 phone support</li>
              <li>• API access</li>
              <li>• Dedicated account manager</li>
            </ul>
            <Button
              onClick={() => subscriptionMutation.mutate({ amount: 12999, planName: "Enterprise Plan" })}
              disabled={subscriptionMutation.isPending}
              className="w-full"
            >
              {subscriptionMutation.isPending ? "Processing..." : "Subscribe Now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment History
          </CardTitle>
          <CardDescription>Track all your payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No payment history found</p>
              <p className="text-sm">Your payments will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: Payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{payment.description}</h4>
                      {getPaymentStatusBadge(payment.paymentStatus)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(payment.createdAt)} • {payment.paymentType}
                    </p>
                    {payment.razorpayPaymentId && (
                      <p className="text-xs text-gray-500 mt-1">
                        Payment ID: {payment.razorpayPaymentId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {formatAmount(payment.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}