import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { 
  Hotel, 
  Users, 
  Receipt, 
  BarChart3, 
  ArrowRight, 
  CheckCircle, 
  Calendar,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Shield,
  Zap,
  Clock,
  Star,
  Menu,
  X
} from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin, SiX } from "react-icons/si";

const AnimatedSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FeatureCard = ({ color, icon: Icon, title, description, delay }: { color: string; icon: any; title: string; description: string; delay: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-400 hover:bg-amber-500",
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    rose: "bg-rose-500 hover:bg-rose-600",
    violet: "bg-violet-600 hover:bg-violet-700",
    sky: "bg-sky-500 hover:bg-sky-600",
    orange: "bg-orange-500 hover:bg-orange-600",
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 100, scale: 0.9 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className={`${colorClasses[color]} rounded-3xl p-8 text-white cursor-pointer transition-colors min-h-[320px] flex flex-col justify-between`}
    >
      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-white/80 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

const MarqueeText = ({ text, direction = "left" }: { text: string; direction?: "left" | "right" }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap py-4">
      <motion.div
        animate={{ x: direction === "left" ? [0, -1000] : [-1000, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="inline-flex gap-8"
      >
        {[...Array(10)].map((_, i) => (
          <span key={i} className="text-6xl md:text-8xl font-black text-gray-100 tracking-tight">
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const { data: pricingConfig } = useQuery<{ hotelierPrice?: number; enterprisePrice?: number }>({
    queryKey: ["/api/admin/pricing-config"],
    retry: false,
  });

  useEffect(() => {
    document.title = "EaseInn - Smart Hotel Management for Modern Properties";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'EaseInn transforms hotel operations with smart check-ins, QR self-service, GST billing, and real-time analytics. Built for Indian hotels.');
    }
  }, []);

  const features = [
    { 
      color: "amber", 
      icon: QrCode, 
      title: "QR Check-in", 
      description: "Guests scan, upload ID, and check themselves in. Zero queues, zero hassle." 
    },
    { 
      color: "emerald", 
      icon: Calendar, 
      title: "Smart Bookings", 
      description: "Manage reservations, availability, and room assignments from one dashboard." 
    },
    { 
      color: "rose", 
      icon: Receipt, 
      title: "GST Invoicing", 
      description: "Auto-generate GST-compliant invoices with proper tax calculations." 
    },
    { 
      color: "violet", 
      icon: BarChart3, 
      title: "Live Analytics", 
      description: "Track occupancy, revenue, and trends with beautiful visual reports." 
    },
  ];

  const stats = [
    { value: "500+", label: "Hotels Trust Us" },
    { value: "2M+", label: "Guests Served" },
    { value: "98%", label: "Satisfaction Rate" },
    { value: "24/7", label: "Support Available" },
  ];

  const benefits = [
    { icon: Clock, text: "5-minute setup, no training needed" },
    { icon: Shield, text: "Bank-grade security for guest data" },
    { icon: Smartphone, text: "Works on any device, anywhere" },
    { icon: Zap, text: "Instant updates across all screens" },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-black text-gray-900 tracking-tight">EaseInn</span>
            </motion.div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-violet-600 transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-violet-600 transition-colors font-medium">
              Pricing
            </a>
            <Link href="/contact">
              <span className="text-gray-600 hover:text-violet-600 transition-colors font-medium cursor-pointer">
                Contact
              </span>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button 
                className="hidden md:flex bg-gray-900 hover:bg-gray-800 text-white rounded-full px-8 py-6 font-semibold shadow-xl hover:shadow-2xl transition-all"
                data-testid="button-get-started"
              >
                Start Free Trial
              </Button>
            </Link>
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-6 py-4"
          >
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-600 font-medium py-2">Features</a>
              <a href="#pricing" className="text-gray-600 font-medium py-2">Pricing</a>
              <Link href="/contact"><span className="text-gray-600 font-medium py-2">Contact</span></Link>
              <Link href="/login">
                <Button className="w-full bg-gray-900 text-white rounded-full mt-2">
                  Start Free Trial
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 min-h-screen flex items-center relative">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-6"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-gray-900 leading-[0.9] tracking-tight mb-8">
                Hotel ops,
                <br />
                <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  simplified.
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              From guest check-in to checkout, manage everything with one powerful platform built for Indian hotels.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-gray-800 text-white text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all font-semibold"
                  data-testid="button-hero-cta"
                >
                  Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <span className="text-gray-400 text-sm">No credit card required</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Animated Gradient Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 flex">
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex-1 bg-amber-400 origin-left"
          />
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="flex-1 bg-emerald-500 origin-left"
          />
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex-1 bg-rose-500 origin-left"
          />
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="flex-1 bg-violet-600 origin-left"
          />
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="flex-1 bg-sky-500 origin-left"
          />
        </div>
      </section>

      {/* Scrolling Text */}
      <section className="py-8 bg-gray-50 overflow-hidden">
        <MarqueeText text="EASEINN" />
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <AnimatedSection className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
              EaseInn isn't just software, it's your
              <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent"> complete hotel command center.</span>
            </h2>
            <p className="text-xl text-gray-500">
              Built specifically for independent hotels, resorts, and boutique properties across India.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" id="features">
            {features.map((feature, idx) => (
              <FeatureCard key={feature.title} {...feature} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Trusted by hotels that care about their guests
            </h2>
            <p className="text-gray-400 text-lg">Numbers that speak for themselves</p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <AnimatedSection key={stat.label} delay={idx * 0.1} className="text-center">
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-8">
                Why hotel owners
                <br />
                <span className="text-violet-600">love EaseInn</span>
              </h2>
              
              <div className="space-y-6">
                {benefits.map((benefit, idx) => (
                  <motion.div 
                    key={benefit.text}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-4"
                  >
                    <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-violet-600" />
                    </div>
                    <span className="text-lg text-gray-700">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10">
                  <Star className="w-12 h-12 mb-6 text-amber-300" />
                  <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed mb-6">
                    "EaseInn transformed how we run our 50-room hotel. Check-ins that took 10 minutes now take 30 seconds."
                  </blockquote>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Rajesh Kumar</div>
                      <div className="text-white/70 text-sm">Hotel Sunrise, Jaipur</div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-xl text-gray-500">Start free, upgrade when you're ready</p>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="max-w-lg mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8 text-white text-center">
                <div className="text-sm uppercase tracking-wider mb-2 text-violet-200">Professional Plan</div>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-black">₹{pricingConfig?.hotelierPrice || 1999}</span>
                  <span className="text-violet-200 ml-2">/month</span>
                </div>
              </div>
              
              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited rooms & guests",
                    "QR code self check-in",
                    "GST-compliant invoicing",
                    "Real-time analytics dashboard",
                    "WhatsApp notifications",
                    "Razorpay payment integration",
                    "Priority email & chat support",
                    "Free setup assistance"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/login">
                  <Button 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 rounded-full text-lg font-semibold"
                    data-testid="button-pricing-cta"
                  >
                    Start 14-Day Free Trial
                  </Button>
                </Link>
                <p className="text-center text-gray-400 text-sm mt-4">No credit card required to start</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Ready to transform
              <br />
              your hotel operations?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join hundreds of hotels already using EaseInn to delight their guests.
            </p>
            <Link href="/login">
              <Button 
                size="lg"
                className="bg-white text-violet-600 hover:bg-gray-100 text-lg px-12 py-7 rounded-full shadow-2xl font-bold transform hover:scale-105 transition-all"
                data-testid="button-final-cta"
              >
                Get Started for Free <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center">
                  <Hotel className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">EaseInn</span>
              </div>
              <p className="text-sm leading-relaxed">
                Smart hotel management software built for Indian hotels. Simplify operations, delight guests.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/login"><span className="hover:text-white transition-colors cursor-pointer">Free Trial</span></Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms"><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></Link></li>
                <li><Link href="/privacy"><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></Link></li>
                <li><Link href="/refunds"><span className="hover:text-white transition-colors cursor-pointer">Refund Policy</span></Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>hello@easeinn.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Mumbai, India</span>
                </li>
              </ul>
              
              <div className="flex space-x-4 mt-6">
                <a href="#" className="hover:text-white transition-colors"><SiX className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><SiLinkedin className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><SiInstagram className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><SiFacebook className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} EaseInn. All rights reserved.</p>
            <p className="text-sm mt-2 md:mt-0">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
