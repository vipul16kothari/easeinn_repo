import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, Shield, AlertTriangle } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600 text-lg">Last Updated: August 22, 2025</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Agreement to Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              By accessing and using EaseInn ("the Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Service Description</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <p>
              EaseInn is a comprehensive hotel management platform that provides:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Property management system for hotels and accommodations</li>
              <li>Guest check-in and checkout management</li>
              <li>Room inventory and booking management</li>
              <li>Payment processing through secure gateways</li>
              <li>GST-compliant invoice generation</li>
              <li>Reporting and analytics tools</li>
              <li>Multi-property support for hotel chains</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. User Accounts and Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Account Registration</h4>
            <p>
              You must provide accurate, current, and complete information during registration. 
              You are responsible for safeguarding your account credentials.
            </p>
            
            <h4 className="font-semibold">User Conduct</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service only for lawful purposes</li>
              <li>Not attempt to gain unauthorized access to the system</li>
              <li>Not interfere with the security features of the service</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Maintain accurate guest and booking information</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Subscription and Payment Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Subscription Plans</h4>
            <p>
              EaseInn offers multiple subscription tiers with different features and pricing. 
              All fees are charged in advance on a monthly basis unless otherwise stated.
            </p>
            
            <h4 className="font-semibold">Payment Processing</h4>
            <p>
              Payments are processed securely through Razorpay. By providing payment information, 
              you authorize us to charge the applicable fees to your payment method.
            </p>
            
            <h4 className="font-semibold">Automatic Renewal</h4>
            <p>
              Subscriptions automatically renew for successive periods unless cancelled before 
              the renewal date. You may cancel your subscription at any time through your account settings.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>4. Data Security and Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <p>
              We implement appropriate security measures to protect your data. Guest information, 
              payment details, and business data are encrypted and stored securely.
            </p>
            <p>
              You retain ownership of your hotel and guest data. We will not access, use, or 
              disclose your data except as necessary to provide the service or as required by law.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <p>
              EaseInn and its original content, features, and functionality are owned by us and 
              are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, or create derivative works of our service 
              without express written permission.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              6. Limitation of Liability
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <p>
              EaseInn is provided "as is" without warranty of any kind. We shall not be liable 
              for any indirect, incidental, special, or consequential damages resulting from 
              the use or inability to use our service.
            </p>
            <p>
              Our total liability shall not exceed the amount paid by you for the service 
              during the twelve months preceding the event giving rise to liability.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Termination</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <p>
              We may terminate or suspend your account immediately if you breach these terms. 
              Upon termination, your right to use the service will cease immediately.
            </p>
            <p>
              You may terminate your account at any time by contacting our support team. 
              Data export options are available upon request before account closure.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              These terms shall be governed by and construed in accordance with the laws of India. 
              Any disputes arising from these terms shall be subject to the exclusive jurisdiction 
              of the courts in Mumbai, Maharashtra.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We reserve the right to modify these terms at any time. We will notify users of 
              any material changes via email or through the platform. Continued use of the 
              service after changes constitutes acceptance of the new terms.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="text-center text-gray-600">
          <p>
            For questions about these Terms & Conditions, please contact us at{" "}
            <a href="mailto:vipul16kothari@gmail.com" className="text-blue-600 hover:underline">
              vipul16kothari@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}