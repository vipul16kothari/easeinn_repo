import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Calendar, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Refunds() {
  useEffect(() => {
    document.title = "Refunds & Cancellation Policy - EaseInn Hotel Management";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Understand EaseInn\'s refund and cancellation policy. Learn about refund timeframes, cancellation terms, and how to process refunds for our hotel management platform subscriptions.');
    }
  }, []);
  const refundTimeframes = [
    {
      method: "Razorpay (Cards/UPI)",
      timeframe: "5-7 business days",
      icon: CreditCard,
      color: "blue"
    },
    {
      method: "Net Banking",
      timeframe: "5-7 business days", 
      icon: CreditCard,
      color: "green"
    },
    {
      method: "Digital Wallets",
      timeframe: "1-3 business days",
      icon: CreditCard,
      color: "purple"
    }
  ];

  const cancellationScenarios = [
    {
      scenario: "Within 24 hours of subscription",
      refund: "100% refund",
      status: "full",
      icon: CheckCircle,
      description: "Full refund for new subscriptions cancelled within 24 hours"
    },
    {
      scenario: "Within 7 days of subscription",
      refund: "Pro-rated refund",
      status: "partial",
      icon: Clock,
      description: "Refund for unused portion of the subscription period"
    },
    {
      scenario: "After 7 days",
      refund: "No refund",
      status: "none",
      icon: XCircle,
      description: "No refund available, but service continues until end of billing period"
    },
    {
      scenario: "Technical issues (our fault)",
      refund: "Case-by-case basis",
      status: "case",
      icon: AlertTriangle,
      description: "Evaluated individually based on service disruption"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "full":
        return <Badge className="bg-green-100 text-green-800">Full Refund</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial Refund</Badge>;
      case "none":
        return <Badge variant="destructive">No Refund</Badge>;
      case "case":
        return <Badge variant="secondary">Case by Case</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refunds & Cancellation Policy</h1>
          <p className="text-gray-600 text-lg">Last Updated: August 22, 2025</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              This Refunds & Cancellation Policy outlines the terms and conditions for subscription 
              cancellations, refunds, and related processes for EaseInn hotel management platform. 
              We strive to be fair and transparent in all our refund policies.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Subscription Cancellation Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">How to Cancel</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Log into your EaseInn account and go to Payments section</li>
              <li>Click "Manage Subscription" or "Cancel Subscription"</li>
              <li>Follow the cancellation process and provide feedback (optional)</li>
              <li>You will receive a confirmation email within 30 minutes</li>
            </ul>

            <h4 className="font-semibold">Alternative Cancellation Methods</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email us at vipul16kothari@gmail.com with "Cancellation Request" in subject</li>
              <li>Include your hotel name and account email in the request</li>
              <li>We will process the cancellation within 24 hours</li>
            </ul>

            <h4 className="font-semibold">Service Continuation</h4>
            <p>
              After cancellation, your service will continue until the end of your current billing period. 
              You will retain access to all features until the subscription expires.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Refund Eligibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cancellationScenarios.map((scenario, index) => {
                const IconComponent = scenario.icon;
                return (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-gray-600 mt-1" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{scenario.scenario}</h4>
                        {getStatusBadge(scenario.status)}
                      </div>
                      <p className="text-gray-600 text-sm">{scenario.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Refund Processing Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {refundTimeframes.map((method, index) => {
                const IconComponent = method.icon;
                return (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-${method.color}-100 flex items-center justify-center mb-3`}>
                      <IconComponent className={`w-6 h-6 text-${method.color}-600`} />
                    </div>
                    <h4 className="font-medium mb-2">{method.method}</h4>
                    <p className="text-gray-600 text-sm">{method.timeframe}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Refund timeframes depend on your bank and payment method. 
                Some banks may take additional time to process refunds.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Non-Refundable Items</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <p>The following are generally not eligible for refunds:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Setup and Configuration Fees:</strong> One-time setup costs for custom configurations</li>
              <li><strong>Third-party Integrations:</strong> Costs for external service integrations</li>
              <li><strong>Data Migration Services:</strong> Professional services for data import/migration</li>
              <li><strong>Training and Consultation:</strong> Professional services already delivered</li>
              <li><strong>Promotional Pricing:</strong> Discounted subscriptions may have different terms</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Special Circumstances</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Technical Issues</h4>
            <p>
              If our platform experiences significant downtime or technical issues that prevent 
              you from using the service, we may provide credits or refunds on a case-by-case basis.
            </p>

            <h4 className="font-semibold">Force Majeure</h4>
            <p>
              In cases of natural disasters, government regulations, or other circumstances beyond 
              our control that affect service delivery, refunds will be evaluated individually.
            </p>

            <h4 className="font-semibold">Business Closure</h4>
            <p>
              If your hotel business permanently closes, please contact us with documentation. 
              We may provide pro-rated refunds for remaining subscription periods.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Refund Process</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-sm">Submit Request</h4>
                <p className="text-gray-600 text-xs">Email or account portal</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-sm">Review</h4>
                <p className="text-gray-600 text-xs">24-48 hour evaluation</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-sm">Approval</h4>
                <p className="text-gray-600 text-xs">Decision notification</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <h4 className="font-medium text-sm">Processing</h4>
                <p className="text-gray-600 text-xs">5-7 business days</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Required Information for Refund Requests</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Account email and hotel name</li>
                <li>• Reason for cancellation/refund request</li>
                <li>• Original payment method details</li>
                <li>• Transaction ID or invoice number</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Retention After Cancellation</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Immediate Access</h4>
            <p>
              Upon cancellation, you retain full access to your data until the end of your billing period.
            </p>

            <h4 className="font-semibold">Grace Period</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>30 days:</strong> Data remains accessible for reactivation</li>
              <li><strong>60 days:</strong> Data archived but recoverable upon request</li>
              <li><strong>90 days:</strong> Data permanently deleted (cannot be recovered)</li>
            </ul>

            <h4 className="font-semibold">Data Export</h4>
            <p>
              You can export your hotel and guest data at any time before permanent deletion. 
              Contact support for assistance with data export.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact for Refunds</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              For all refund and cancellation requests, please contact our support team:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p className="mb-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:vipul16kothari@gmail.com?subject=EaseInn Refund Request" className="text-blue-600 hover:underline">
                  vipul16kothari@gmail.com
                </a>
              </p>
              <p className="mb-2">
                <strong>Subject Line:</strong> "EaseInn Refund Request - [Your Hotel Name]"
              </p>
              <p>
                <strong>Response Time:</strong> Within 24 hours during business hours
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="text-center text-gray-600">
          <p>
            This policy is subject to change. We will notify you of any material changes 
            via email or through our platform. For questions about this policy, please 
            contact us at{" "}
            <a href="mailto:vipul16kothari@gmail.com" className="text-blue-600 hover:underline">
              vipul16kothari@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}