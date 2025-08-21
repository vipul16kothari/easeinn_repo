import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Users, Receipt, BarChart3, Shield, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Hotel className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">HotelHub Pro</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline" data-testid="button-login">Login</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="button-register">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Complete Hotel Management
            <span className="text-blue-600 block">Made Simple</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your hotel operations with our comprehensive B2B platform. 
            From guest check-ins to GST-compliant invoicing, we've got you covered.
          </p>
          <div className="space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3" data-testid="button-start-trial">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3" data-testid="button-view-demo">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Run Your Hotel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center" data-testid="card-guest-management">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Guest Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Complete guest profiles with check-in/out workflows, digital signatures, and booking history.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-room-tracking">
              <CardHeader>
                <Hotel className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Room Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Real-time room status, availability calendar, and occupancy management across multiple properties.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-gst-billing">
              <CardHeader>
                <Receipt className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>GST Compliant Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automated invoice generation with proper GST breakdown, CGST, SGST, and IGST calculations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-analytics">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Comprehensive reporting on occupancy rates, revenue, and operational metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-multi-property">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Multi-Property Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Manage multiple hotels from a single dashboard with role-based access control.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center" data-testid="card-real-time">
              <CardHeader>
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Live updates on room status, guest activities, and payment processing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple, Transparent Pricing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative" data-testid="card-hotelier-plan">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Hotelier Plan</CardTitle>
                <div className="text-4xl font-bold text-blue-600">₹2,999<span className="text-sm text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">✓ Up to 50 rooms</li>
                  <li className="flex items-center">✓ Guest management</li>
                  <li className="flex items-center">✓ GST compliant billing</li>
                  <li className="flex items-center">✓ Basic analytics</li>
                  <li className="flex items-center">✓ Email support</li>
                </ul>
                <Link href="/register?plan=hotelier" className="block mt-6">
                  <Button className="w-full" data-testid="button-choose-hotelier">Choose Plan</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative border-blue-500" data-testid="card-enterprise-plan">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm">Popular</span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise Plan</CardTitle>
                <div className="text-4xl font-bold text-blue-600">₹9,999<span className="text-sm text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">✓ Unlimited rooms</li>
                  <li className="flex items-center">✓ Multiple properties</li>
                  <li className="flex items-center">✓ Advanced analytics</li>
                  <li className="flex items-center">✓ Custom integrations</li>
                  <li className="flex items-center">✓ Priority support</li>
                </ul>
                <Link href="/register?plan=enterprise" className="block mt-6">
                  <Button className="w-full" data-testid="button-choose-enterprise">Choose Plan</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Hotel className="h-6 w-6" />
                <h4 className="text-lg font-semibold">HotelHub Pro</h4>
              </div>
              <p className="text-gray-400">
                Complete hotel management solution for modern hospitality businesses.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Training</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 HotelHub Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}