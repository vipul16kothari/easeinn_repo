import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Eye, Lock, Database, Users, Mail } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 text-lg">Last Updated: August 22, 2025</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Our Commitment to Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              At EaseInn, we are committed to protecting your privacy and ensuring the security 
              of your personal and business information. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you use our hotel 
              management platform.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              1. Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Personal Information</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, and contact information</li>
              <li>Hotel business information and addresses</li>
              <li>GST numbers and tax identification details</li>
              <li>Payment information (processed securely through Razorpay)</li>
              <li>User account credentials and preferences</li>
            </ul>

            <h4 className="font-semibold">Guest Information</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Guest names, contact details, and identification</li>
              <li>Check-in and check-out information</li>
              <li>Room preferences and special requests</li>
              <li>Digital signatures for registration</li>
              <li>Booking and payment history</li>
            </ul>

            <h4 className="font-semibold">Technical Information</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP addresses and browser information</li>
              <li>Device identifiers and operating system details</li>
              <li>Usage patterns and feature utilization</li>
              <li>Log files and error reports</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              2. How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Service Provision</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our hotel management platform</li>
              <li>Process bookings, check-ins, and payments</li>
              <li>Generate GST-compliant invoices and reports</li>
              <li>Manage room inventory and availability</li>
              <li>Facilitate communication between hotels and guests</li>
            </ul>

            <h4 className="font-semibold">Business Operations</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process subscription payments and manage billing</li>
              <li>Provide customer support and technical assistance</li>
              <li>Send service updates and important notifications</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>

            <h4 className="font-semibold">Legal Compliance</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Comply with tax reporting requirements</li>
              <li>Maintain records as required by hospitality regulations</li>
              <li>Respond to legal requests and court orders</li>
              <li>Protect our rights and enforce our terms of service</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              3. Information Sharing and Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">We Do Not Sell Your Data</h4>
            <p>
              We do not sell, trade, or rent your personal information to third parties 
              for marketing purposes.
            </p>

            <h4 className="font-semibold">Limited Sharing</h4>
            <p>We may share information only in these specific circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Trusted partners who help us operate the platform (e.g., Razorpay for payments)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Business Protection:</strong> To protect our rights, property, or safety, or that of our users</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of business assets</li>
            </ul>

            <h4 className="font-semibold">Guest Data</h4>
            <p>
              Guest information belongs to the hotel and is shared only as directed by the hotel 
              or as required by applicable hospitality and tax laws.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              4. Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Security Measures</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data encryption in transit and at rest</li>
              <li>Secure database hosting with regular backups</li>
              <li>Multi-factor authentication for admin accounts</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access controls and employee training</li>
            </ul>

            <h4 className="font-semibold">Payment Security</h4>
            <p>
              Payment information is processed through Razorpay's secure, PCI DSS compliant infrastructure. 
              We do not store complete payment card details on our servers.
            </p>

            <h4 className="font-semibold">Incident Response</h4>
            <p>
              In the unlikely event of a data breach, we will notify affected users and 
              relevant authorities within 72 hours as required by applicable laws.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <p>
              We retain your information for as long as necessary to provide our services 
              and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Until account deletion plus 30 days</li>
              <li><strong>Guest Records:</strong> As required by local hospitality laws (typically 3-7 years)</li>
              <li><strong>Financial Records:</strong> As required by tax laws (typically 7 years in India)</li>
              <li><strong>Technical Logs:</strong> 90 days for security and debugging purposes</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <h4 className="font-semibold">Access and Control</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and update your account information</li>
              <li>Export your hotel and guest data</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of non-essential communications</li>
              <li>Request data portability to another service</li>
            </ul>

            <h4 className="font-semibold">Guest Rights</h4>
            <p>
              Hotel guests can request access to their information through the hotel. 
              We support hotels in fulfilling these requests in compliance with privacy laws.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. International Data Transfers</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Our servers are primarily located in India. If you access our service from 
              outside India, your information may be transferred to and processed in India. 
              We ensure appropriate safeguards are in place for international transfers.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Our service is designed for business use and is not intended for children under 18. 
              We do not knowingly collect personal information from children. If you become aware 
              that a child has provided us with personal information, please contact us.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Updates to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices 
              or applicable laws. We will notify you of any material changes via email or through 
              our platform. The "Last Updated" date at the top indicates when changes were made.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="text-center text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-5 h-5" />
            <span className="font-semibold">Contact Us About Privacy</span>
          </div>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
            <a href="mailto:vipul16kothari@gmail.com" className="text-blue-600 hover:underline">
              vipul16kothari@gmail.com
            </a>
          </p>
          <p className="mt-2 text-sm">
            Data Protection Officer: Vipul Kothari<br />
            Response time: Within 48 hours for privacy inquiries
          </p>
        </div>
      </div>
    </div>
  );
}