import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Clock, MessageSquare, Headphones, Bug, CreditCard } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const mailtoLink = `mailto:vipul16kothari@gmail.com?subject=${encodeURIComponent(`EaseInn Contact: ${formData.subject}`)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCategory: ${formData.category}\n\nMessage:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
    
    toast({
      title: "Opening Email Client",
      description: "Your default email client should open with the pre-filled message.",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help with your account and technical issues",
      contact: "vipul16kothari@gmail.com",
      action: "mailto:vipul16kothari@gmail.com",
      color: "blue"
    },
    {
      icon: MessageSquare,
      title: "General Inquiries",
      description: "Questions about EaseInn features and pricing",
      contact: "Send us a message",
      action: "#contact-form",
      color: "green"
    },
    {
      icon: Headphones,
      title: "Technical Support",
      description: "Platform issues and integration help",
      contact: "Priority email support",
      action: "mailto:vipul16kothari@gmail.com?subject=EaseInn Technical Support",
      color: "purple"
    },
    {
      icon: CreditCard,
      title: "Billing & Payments",
      description: "Subscription and payment related queries",
      contact: "Billing support",
      action: "mailto:vipul16kothari@gmail.com?subject=EaseInn Billing Support",
      color: "orange"
    }
  ];

  const supportCategories = [
    { value: "general", label: "General Inquiry" },
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing & Payments" },
    { value: "feature", label: "Feature Request" },
    { value: "bug", label: "Bug Report" },
    { value: "integration", label: "Integration Help" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We're here to help! Reach out to our team for support, questions, or feedback about EaseInn.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-${method.color}-100 flex items-center justify-center mb-3`}>
                    <IconComponent className={`w-6 h-6 text-${method.color}-600`} />
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 text-sm mb-4">{method.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (method.action.startsWith('mailto:')) {
                        window.location.href = method.action;
                      } else if (method.action.startsWith('#')) {
                        document.querySelector(method.action)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full"
                  >
                    {method.contact}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card id="contact-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {supportCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    placeholder="Please provide detailed information about your inquiry..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="font-medium">9:00 AM - 6:00 PM IST</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Saturday</span>
                  <span className="font-medium">10:00 AM - 4:00 PM IST</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sunday</span>
                  <span className="font-medium text-red-600">Closed</span>
                </div>
                <Separator className="my-3" />
                <p className="text-sm text-gray-600">
                  Emergency technical issues are addressed within 24 hours, even outside business hours.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-600" />
                  Report a Bug
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Found a bug or experiencing technical issues? Help us improve EaseInn by reporting it.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = 'mailto:vipul16kothari@gmail.com?subject=EaseInn Bug Report&body=Please describe the bug you encountered:\n\n1. What were you trying to do?\n2. What happened instead?\n3. What browser/device are you using?\n4. Steps to reproduce the issue:'}
                >
                  Report Bug
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">How do I reset my password?</h4>
                    <p className="text-gray-600 text-sm">Use the "Forgot Password" link on the login page.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Can I upgrade my subscription?</h4>
                    <p className="text-gray-600 text-sm">Yes, visit the Payments page to upgrade anytime.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Is my data secure?</h4>
                    <p className="text-gray-600 text-sm">We use enterprise-grade security and encryption.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-12" />

        <div className="text-center text-gray-600">
          <p className="mb-2">
            <strong>EaseInn Support Team</strong>
          </p>
          <p>
            We typically respond to inquiries within 24 hours during business hours.
            For urgent technical issues, please mark your email as "URGENT" in the subject line.
          </p>
        </div>
      </div>
    </div>
  );
}