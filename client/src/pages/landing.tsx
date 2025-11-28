import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Hotel, 
  Users, 
  Receipt, 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Calendar,
  MessageSquare,
  TrendingUp,
  CreditCard,
  Gift,
  Smartphone,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin } from "react-icons/si";

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState("checkin");
  const [email, setEmail] = useState("");

  const { data: pricingConfig } = useQuery<{ hotelierPrice?: number; enterprisePrice?: number }>({
    queryKey: ["/api/admin/pricing-config"],
    retry: false,
  });

  const hotelierPrice = pricingConfig?.hotelierPrice || 1999;

  useEffect(() => {
    document.title = "EaseInn - Guest-First Hotel Management Platform";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Transform your hotel operations with EaseInn. From bookings to post-stay - everything simplified. Trusted by 500+ hotels across India.');
    }
  }, []);

  const features = [
    { id: "checkin", icon: Users, label: "Check-in", color: "text-purple-600 bg-purple-50" },
    { id: "guest", icon: Smartphone, label: "Guest App", color: "text-gray-600 bg-gray-50" },
    { id: "communication", icon: MessageSquare, label: "Guest Communication", color: "text-gray-600 bg-gray-50" },
    { id: "analytics", icon: BarChart3, label: "Business Intelligence", color: "text-gray-600 bg-gray-50" },
    { id: "pricing", icon: TrendingUp, label: "Dynamic Pricing", color: "text-gray-600 bg-gray-50" },
    { id: "ledger", icon: Receipt, label: "Ledger", color: "text-gray-600 bg-gray-50" },
    { id: "billing", icon: CreditCard, label: "Billing", color: "text-gray-600 bg-gray-50" },
    { id: "upselling", icon: Gift, label: "Upselling", color: "text-gray-600 bg-gray-50" },
  ];

  const featureContent: Record<string, { title: string; description: string; points: string[] }> = {
    checkin: {
      title: "Fastest Check-in",
      description: "Streamline your check-in process & ID collection",
      points: ["One Click Web Check-in", "AI Enabled Hotel Check-in", "ID Collection"]
    },
    guest: {
      title: "Guest App",
      description: "Give guests a seamless digital experience",
      points: ["Digital room keys", "In-app requests", "Real-time updates"]
    },
    communication: {
      title: "Guest Communication",
      description: "Stay connected with your guests effortlessly",
      points: ["Automated messages", "WhatsApp integration", "Email campaigns"]
    },
    analytics: {
      title: "Business Intelligence",
      description: "Make data-driven decisions for your property",
      points: ["Occupancy reports", "Revenue analytics", "Guest insights"]
    },
    pricing: {
      title: "Dynamic Pricing",
      description: "Optimize your room rates automatically",
      points: ["AI-powered pricing", "Demand forecasting", "Competitor analysis"]
    },
    ledger: {
      title: "Smart Ledger",
      description: "Track all your financial transactions",
      points: ["Real-time tracking", "GST compliant", "Automated reconciliation"]
    },
    billing: {
      title: "Smart Billing",
      description: "Generate invoices instantly",
      points: ["Auto invoicing", "Multiple payment modes", "Tax calculations"]
    },
    upselling: {
      title: "Easy Upselling",
      description: "Boost your revenue with smart recommendations",
      points: ["Room upgrades", "Add-on services", "Package deals"]
    }
  };

  const stats = [
    { value: "80%", label: "Faster Check-ins", description: "Web Check-ins & Hotel Check-ins" },
    { value: "50%", label: "Increase in Revenue", description: "Easy Upselling & Cross-selling" },
    { value: "90%", label: "Reduction in Guest Queries", description: "Fewer questions, Happier stays" }
  ];

  const painPoints = [
    { icon: Users, title: "Outdated Check-ins & Id collection" },
    { icon: MessageSquare, title: "80% guest queries are repetitive" },
    { icon: Hotel, title: "Outdated legacy platforms, Whatsapp, Paper" },
    { icon: Gift, title: "No digital experience to up-sell" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Glassmorphism Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-purple-100/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">EaseInn</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors font-medium" data-testid="nav-features">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors font-medium" data-testid="nav-pricing">
              Pricing
            </a>
            <Link href="/contact">
              <span className="text-gray-600 hover:text-purple-600 transition-colors font-medium cursor-pointer" data-testid="nav-contact">
                Contact Us
              </span>
            </Link>
          </nav>
          
          <Link href="/login">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all"
              data-testid="button-get-started"
            >
              Let's Talk!
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-purple-50/50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Guest-First
              <br />
              <span className="text-gradient-purple">Hotel Manager</span>
            </h1>
            
            <p className="text-xl text-gray-500 mb-10 uppercase tracking-wider">
              From Bookings to Post Stay - Everything Simplified
            </p>
            
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-10 py-6 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                data-testid="button-book-demo"
              >
                Book Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Product Mockup */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="flex">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 hidden md:block">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Hotel className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">EASEINN</span>
                  </div>
                  
                  <nav className="space-y-1">
                    <div className="flex items-center space-x-3 px-3 py-2 bg-purple-100 rounded-lg text-purple-700">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Room View</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">All Checkins</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Gift className="h-4 w-4" />
                      <span className="text-sm">Food</span>
                    </div>
                    <div className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Receipt className="h-4 w-4" />
                      <span className="text-sm">Ledger</span>
                    </div>
                  </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Room View</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1 rounded-lg">
                        <span className="text-orange-600 font-medium text-sm">Food Orders</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-sm font-bold">20</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-lg">
                        <span className="text-purple-600 font-medium text-sm">App Requests</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-bold">05</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Status Tabs */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">All</Badge>
                    <Badge className="bg-green-100 text-green-700">Available(23)</Badge>
                    <Badge className="bg-red-100 text-red-700">Occupied(5)</Badge>
                    <Badge className="bg-blue-100 text-blue-700">Reserved(8)</Badge>
                    <Badge className="bg-orange-100 text-orange-700">Checkout Due(5)</Badge>
                    <Badge className="bg-purple-100 text-purple-700">Housekeeping(0)</Badge>
                    <Badge className="bg-teal-100 text-teal-700">Groups(3)</Badge>
                  </div>

                  {/* Room Grid */}
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {[
                      { num: "201", name: "Vishal", status: "occupied" },
                      { num: "202", name: "Vijyant", status: "occupied" },
                      { num: "203", name: "-", status: "available" },
                      { num: "204", name: "Rishu", status: "occupied" },
                      { num: "205", name: "-", status: "available" },
                      { num: "206", name: "Akshay", status: "occupied" },
                      { num: "207", name: "-", status: "available" },
                      { num: "208", name: "-", status: "available" },
                      { num: "301", name: "Rajesh", status: "reserved" },
                      { num: "302", name: "Manthan", status: "occupied" },
                      { num: "303", name: "Sumit", status: "occupied" },
                      { num: "304", name: "-", status: "available" },
                      { num: "305", name: "Suraksha", status: "occupied" },
                      { num: "306", name: "-", status: "available" },
                      { num: "307", name: "Kanchan", status: "occupied" },
                      { num: "308", name: "-", status: "available" },
                    ].map((room) => (
                      <div 
                        key={room.num}
                        className={`p-3 rounded-lg text-center ${
                          room.status === "occupied" ? "bg-red-50 border-red-200" :
                          room.status === "reserved" ? "bg-blue-50 border-blue-200" :
                          "bg-green-50 border-green-200"
                        } border`}
                      >
                        <div className="font-bold text-gray-900">{room.num}</div>
                        <div className="text-xs text-gray-500 truncate">{room.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 bg-gradient-to-b from-white to-purple-50/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Frontdesk loses upto 80 hours a week on repetitive tasks
          </h2>
          
          <div className="text-center mb-16">
            <Badge className="bg-purple-600 text-white px-6 py-2 text-sm">
              One Person. Everyone's Expectations
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {painPoints.map((point, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-2xl flex items-center justify-center">
                  <point.icon className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-gray-600 text-sm">{point.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            One Platform to solve all your Needs
          </h2>

          {/* Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all ${
                  activeFeature === feature.id
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-purple-200"
                }`}
                data-testid={`tab-${feature.id}`}
              >
                <feature.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{feature.label}</span>
              </button>
            ))}
          </div>

          {/* Feature Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-purple-700 to-purple-500 rounded-3xl p-8 aspect-[4/5] flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400">1:20</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="text-purple-600">←</div>
                  <span className="font-semibold text-gray-900">Check-in</span>
                </div>
                <div className="flex space-x-3 mb-4">
                  <Badge variant="outline" className="text-xs">ID Proof</Badge>
                  <Badge variant="outline" className="text-xs">Basic Details</Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">Guests</div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900">Guest 01</div>
                    <div className="text-xs text-gray-500">ID Card 📋</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900">Guest 01</div>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white" data-testid="button-add-id-mockup">
                  Add ID
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4 italic">
                {featureContent[activeFeature].title}
              </h3>
              <p className="text-gray-600 mb-6">
                {featureContent[activeFeature].description}
              </p>
              <ul className="space-y-4">
                {featureContent[activeFeature].points.map((point, idx) => (
                  <li key={idx} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            More done in just few Seconds
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <Card key={idx} className="text-center p-8 border-0 shadow-lg" data-testid={`stat-card-${idx}`}>
                <CardContent className="p-0">
                  <div className="text-5xl md:text-6xl font-bold text-purple-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {stat.label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Get Started Easily in just 5 Minutes
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Book a Demo", desc: "Understand, Evaluate & Explore" },
              { step: "02", title: "Setup Account using AI", desc: "Room Inventory, Communications, Upselling" },
              { step: "03", title: "Go Live", desc: "Deliver the best Guest experience" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    idx === 0 ? "bg-purple-600 text-white" : "bg-white border-2 border-gray-200 text-gray-400"
                  }`}>
                    <div>
                      <div className="text-xl font-bold">{item.step}</div>
                      <div className="text-[10px] uppercase tracking-wider">Step</div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block w-24 h-0.5 bg-gray-200 mx-4 mt-[-2rem]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">Start with a 7-day free trial. No credit card required.</p>

          <div className="max-w-md mx-auto">
            <Card className="border-2 border-purple-200 shadow-xl overflow-hidden" data-testid="pricing-card">
              <div className="bg-purple-600 text-white text-center py-2">
                <span className="text-sm font-medium">Most Popular</span>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Hotelier Plan</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-purple-600">₹{hotelierPrice.toLocaleString()}</span>
                    <span className="text-gray-500 ml-2">/month</span>
                  </div>
                  <p className="text-gray-500 mt-2">Perfect for single properties</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    "Up to 50 rooms",
                    "Complete guest management",
                    "GST compliant billing",
                    "WhatsApp notifications",
                    "Analytics dashboard",
                    "Email support"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/login">
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg rounded-full"
                    data-testid="button-start-trial"
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 mx-4 md:mx-8 mb-8">
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-3xl p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Property?
          </h2>
          <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of property owners who have streamlined operations, increased revenue, and 
            delighted guests with EaseInn's all-in-one hotel management platform.
          </p>
          <Link href="/login">
            <Button 
              variant="outline" 
              className="bg-white text-purple-600 hover:bg-gray-50 border-0 px-8 py-6 text-lg rounded-full"
              data-testid="button-cta-demo"
            >
              Book Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center">
                  <Hotel className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">EaseInn</span>
              </div>
              <p className="text-gray-500 mb-4">The #1 preferred Hotel Manager</p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors" data-testid="link-facebook">
                  <SiFacebook className="h-5 w-5 text-gray-600" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors" data-testid="link-instagram">
                  <SiInstagram className="h-5 w-5 text-gray-600" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors" data-testid="link-linkedin">
                  <SiLinkedin className="h-5 w-5 text-gray-600" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Links</h4>
              <ul className="space-y-3">
                <li><a href="#pricing" className="text-gray-500 hover:text-purple-600 transition-colors" data-testid="link-pricing-footer">Pricing</a></li>
                <li><Link href="/terms" className="text-gray-500 hover:text-purple-600 transition-colors" data-testid="link-terms">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="text-gray-500 hover:text-purple-600 transition-colors" data-testid="link-privacy">Privacy Policy</Link></li>
                <li><Link href="/refunds" className="text-gray-500 hover:text-purple-600 transition-colors" data-testid="link-refunds">Refund Policy</Link></li>
                <li><Link href="/contact" className="text-gray-500 hover:text-purple-600 transition-colors" data-testid="link-contact-footer">Contact Us</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">+91 9258424155</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">support@easeinn.com</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Subscribe to Our Newsletter</h4>
              <p className="text-gray-500 text-sm mb-4">Stay Updated with our latest Features & Reviews</p>
              <div className="flex">
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-l-full border-r-0"
                  data-testid="input-newsletter"
                />
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-r-full px-6" data-testid="button-subscribe">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} EaseInn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
