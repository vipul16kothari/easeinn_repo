import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, ArrowRight, Check, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { signInWithGoogle, isAuthenticated, isLoading: authLoading } = useSupabaseAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Sign In - EaseInn Hotel Management";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Sign in to your EaseInn hotel management account. Access your dashboard, manage rooms, guests, bookings, and payments from anywhere.');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      setIsSigningIn(false);
    }
  };

  const benefits = [
    "Instant access to your dashboard",
    "Secure Google authentication",
    "No passwords to remember",
    "Manage your hotel from anywhere"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" data-testid="card-login">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center">
              <Hotel className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">EaseInn</CardTitle>
          <p className="text-gray-600">Welcome to your hotel management platform</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3 text-gray-600">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={isSigningIn || authLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            data-testid="button-google-login"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <SiGoogle className="mr-3 h-5 w-5" />
                Continue with Google
                <ArrowRight className="ml-3 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-purple-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-purple-600 hover:underline">
              Privacy Policy
            </Link>
          </p>

          <div className="text-center pt-4 border-t">
            <Link href="/" className="text-purple-600 hover:underline text-sm" data-testid="link-home">
              ← Back to Homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
