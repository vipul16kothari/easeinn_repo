import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hotel, Users, Receipt, BarChart3, Shield, Clock, Star, ArrowRight, CheckCircle, Sparkles, Zap, Globe, Calendar } from "lucide-react";

export default function Landing() {
  useEffect(() => {
    document.title = "EaseInn - Comprehensive Hotel Management Platform | Multi-Property PMS";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Transform your hotel operations with EaseInn\'s AI-powered management platform. Features multi-property support, real-time inventory, GST-compliant invoicing, and integrated Razorpay payments. Trusted by 500+ hotels worldwide.');
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'EaseInn - Transform Hotel Operations with AI-Powered Management');
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Comprehensive B2B hotel management platform with multi-property support, real-time inventory tracking, automated check-ins, and integrated payment solutions.');
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-gradient-to-br from-yellow-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative border-b bg-white/70 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Hotel className="h-8 w-8 text-blue-600" />
              <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EaseInn</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Pricing</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Contact</a>
          </nav>
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium" data-testid="button-login">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" data-testid="button-register">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 hover:bg-gradient-to-r hover:from-blue-200 hover:to-purple-200">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 500+ Hotels Worldwide
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Hotel Management
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your hotel operations with our AI-powered platform. 
              <span className="text-blue-600 font-semibold">Automate check-ins</span>, 
              <span className="text-purple-600 font-semibold"> streamline bookings</span>, and 
              <span className="text-pink-600 font-semibold"> boost revenue</span> effortlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/register">
                <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300" data-testid="button-start-trial">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300" data-testid="button-view-demo">
                <Globe className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                14-day free trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Setup in 5 minutes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Run Your Hotel
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From guest management to revenue analytics, we've built the complete toolkit for modern hoteliers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-indigo-50" data-testid="card-guest-management">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Guest Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Complete guest profiles with automated check-in/out workflows, digital signatures, and comprehensive booking history.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">Digital Signatures</Badge>
                  <Badge variant="secondary" className="text-xs">Auto Check-in</Badge>
                  <Badge variant="secondary" className="text-xs">Guest History</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-pink-50" data-testid="card-room-tracking">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Hotel className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Real-time Room Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Monitor room status, housekeeping schedules, and availability in real-time with our intuitive calendar interface.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">Live Status</Badge>
                  <Badge variant="secondary" className="text-xs">Housekeeping</Badge>
                  <Badge variant="secondary" className="text-xs">Calendar View</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-green-50 to-emerald-50" data-testid="card-billing">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Receipt className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Billing & GST</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Generate GST-compliant invoices automatically with integrated tax calculations and payment tracking.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">GST Compliant</Badge>
                  <Badge variant="secondary" className="text-xs">Auto Invoices</Badge>
                  <Badge variant="secondary" className="text-xs">Payment Tracking</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-red-50" data-testid="card-analytics">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Comprehensive insights and reports to track occupancy rates, revenue trends, and guest satisfaction.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">Occupancy Reports</Badge>
                  <Badge variant="secondary" className="text-xs">Revenue Trends</Badge>
                  <Badge variant="secondary" className="text-xs">Guest Insights</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-indigo-50 to-blue-50" data-testid="card-security">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Bank-grade security with role-based access control, data encryption, and compliance features.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">Role-based Access</Badge>
                  <Badge variant="secondary" className="text-xs">Data Encryption</Badge>
                  <Badge variant="secondary" className="text-xs">Compliance</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-teal-50 to-cyan-50" data-testid="card-automation">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl">Smart Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Automate repetitive tasks with AI-powered workflows for check-ins, room assignments, and housekeeping schedules.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">AI Workflows</Badge>
                  <Badge variant="secondary" className="text-xs">Auto Assignment</Badge>
                  <Badge variant="secondary" className="text-xs">Smart Scheduling</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-50 text-green-700 border-green-200">
              <Star className="w-4 h-4 mr-2" />
              Transparent Pricing
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Choose Your
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, transparent pricing that grows with your business. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="relative group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-white" data-testid="card-hotelier-plan">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Hotel className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Hotelier Plan</CardTitle>
                <div className="text-5xl font-bold text-blue-600 mt-4">₹2,999
                  <span className="text-lg text-gray-500 font-normal">/month</span>
                </div>
                <p className="text-gray-500 mt-2">Perfect for single properties</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Up to 50 rooms
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Complete guest management
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    GST compliant billing
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Basic analytics & reports
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    Email support
                  </div>
                </div>
                <Link href="/signup?plan=hotelier" className="block mt-8">
                  <Button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" data-testid="button-choose-hotelier">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white overflow-hidden" data-testid="card-enterprise-plan">
              <div className="absolute top-4 right-4">
                <Badge className="bg-yellow-400 text-yellow-900 font-semibold">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Enterprise Plan</CardTitle>
                <div className="text-5xl font-bold text-white mt-4">₹9,999
                  <span className="text-lg text-purple-100 font-normal">/month</span>
                </div>
                <p className="text-purple-100 mt-2">For hotel chains & large properties</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0" />
                    Unlimited rooms & properties
                  </div>
                  <div className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0" />
                    Advanced analytics & insights
                  </div>
                  <div className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0" />
                    Custom integrations & API
                  </div>
                  <div className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0" />
                    Priority support & training
                  </div>
                  <div className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-yellow-300 mr-3 flex-shrink-0" />
                    Dedicated account manager
                  </div>
                </div>
                <Link href="/signup?plan=enterprise" className="block mt-8">
                  <Button className="w-full py-3 bg-white text-purple-600 hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200" data-testid="button-choose-enterprise">
                    Choose Enterprise <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Need a custom solution? We've got you covered.</p>
            <a href="mailto:vipul16kothari@gmail.com?subject=EaseInn%20Custom%20Solution%20Inquiry&body=Hi%2C%20I'm%20interested%20in%20a%20custom%20solution%20for%20my%20hotel%20property.%20Please%20contact%20me%20to%20discuss%20further.">
              <Button variant="outline" size="lg" className="px-8 py-3 border-purple-300 text-purple-600 hover:bg-purple-50">
                Contact Sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <Hotel className="h-8 w-8 text-white" />
                  <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">EaseInn</h4>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-md">
                Revolutionizing hotel management with cutting-edge technology. Transform your operations and delight your guests with EaseInn.
              </p>
              <div className="flex space-x-4">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                  <Star className="w-3 h-3 mr-1" />
                  500+ Hotels
                </Badge>
                <Badge className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  99.9% Uptime
                </Badge>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-lg mb-6 text-white">Product</h5>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#features" className="hover:text-blue-400 transition-colors hover:underline">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors hover:underline">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors hover:underline">API Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors hover:underline">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-lg mb-6 text-white">Support</h5>
              <ul className="space-y-3 text-gray-300">
                <li><a href="/contact" className="hover:text-blue-400 transition-colors hover:underline">Contact Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors hover:underline">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors hover:underline">Training</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors hover:underline">Status Page</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-lg mb-6 text-white">Legal</h5>
              <ul className="space-y-3 text-gray-300">
                <li><a href="/terms" className="hover:text-blue-400 transition-colors hover:underline">Terms & Conditions</a></li>
                <li><a href="/privacy" className="hover:text-blue-400 transition-colors hover:underline">Privacy Policy</a></li>
                <li><a href="/refunds" className="hover:text-blue-400 transition-colors hover:underline">Refunds & Cancellation</a></li>
                <li><a href="mailto:vipul16kothari@gmail.com" className="hover:text-blue-400 transition-colors hover:underline">Legal Inquiries</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2025 EaseInn. All rights reserved. Made with ❤️ for hoteliers.
              </p>
              <div className="flex items-center space-x-6 text-gray-400">
                <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
                <a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a>
                <a href="/refunds" className="hover:text-blue-400 transition-colors">Refunds</a>
                <a href="/contact" className="hover:text-blue-400 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}