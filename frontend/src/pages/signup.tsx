import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth, getAuthenticatedRedirectPath } from "@/lib/auth";
import { createUserProfile, getUserProfile } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Home, User, Loader2, ArrowLeft, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";

function calculateAge(dobString: string): number {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"host" | "seeker" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    agreeToTerms: false,
  });

const { user, isLoading: authLoading, signInWithGoogle, setUserProfile, refreshProfile, sendMagicLink } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      setLocation(getAuthenticatedRedirectPath(user));
    }
  }, [authLoading, user, setLocation]);

  const handleRoleSelect = (selectedRole: "host" | "seeker") => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleGoogleSignup = async () => {
    if (!role) {
      toast({ 
        title: "Role not selected", 
        description: "Please select whether you're a host or seeker first.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!formData.agreeToTerms) {
      toast({ 
        title: "Terms not accepted", 
        description: "Please agree to the Terms of Use and Privacy Policy.", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Sign in with Google
      const fbUser = await signInWithGoogle();
      
      if (!fbUser || !fbUser.uid) {
        throw new Error("Failed to get user data from Google");
      }
      
      // Check if user already exists in Firestore
      const existingProfile = await getUserProfile(fbUser.uid);
      
      if (existingProfile) {
        // User exists - sign them in
        setUserProfile(existingProfile);
        toast({ 
          title: "Welcome back!", 
          description: "You've been signed in successfully." 
        });
        setLocation(getAuthenticatedRedirectPath(existingProfile));
        return;
      }
      
      // Create new user profile
      const userProfile = {
        uid: fbUser.uid,
        email: fbUser.email || "",
        fullName: fbUser.displayName || formData.fullName || "",
        role: role,
        status: "active" as const,
        photoUrl: fbUser.photoURL || null,
        age: null,
        dateOfBirth: null,
        gender: null,
        suburb: null,
        state: null,
        phone: null,
        bio: null,
        smokes: null,
        hasPets: null,
        lifestyle: null,
        comfortableWithVisitors: null,
        communicationStyle: null,
      };
      
      await createUserProfile(userProfile);
      setUserProfile(userProfile);
      
      toast({ 
        title: "Account created!", 
        description: "Welcome to TribeSilverCircle! Let's complete your profile setup." 
      });
      
      // Redirect to profile setup to complete additional details
      setLocation("/profile-setup");
      
    } catch (err: unknown) {
      console.error("Google signup error:", err);
      const error = err as { code?: string; message?: string };
      
      // Handle specific Firebase auth errors
      if (error.code === "auth/popup-closed-by-user") {
        toast({ 
          title: "Sign up cancelled", 
          description: "You closed the Google sign-in window. Please try again.",
          variant: "destructive" 
        });
      } else if (error.code === "auth/popup-blocked") {
        toast({ 
          title: "Popup blocked", 
          description: "Please allow popups for this site and try again.",
          variant: "destructive" 
        });
      } else if (error.code === "auth/network-request-failed") {
        toast({ 
          title: "Network error", 
          description: "Please check your internet connection and try again.",
          variant: "destructive" 
        });
      } else if (error.code === "auth/account-exists-with-different-credential") {
        toast({ 
          title: "Account exists", 
          description: "An account already exists with this email. Please sign in instead.",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Sign up failed", 
          description: error.message || "Could not sign up with Google. Please try again.",
          variant: "destructive" 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

 const handleEmailSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!role) {
    toast({ title: "Role not selected", description: "Please select whether you are a host or seeker.", variant: "destructive" });
    return;
  }

  if (!formData.agreeToTerms) {
    toast({ title: "Terms not accepted", description: "Please agree to the Terms of Use and Privacy Policy.", variant: "destructive" });
    return;
  }

  const age = calculateAge(formData.dateOfBirth);
  if (age < 55) {
    toast({ title: "Age Requirement", description: "TribeSilverCircle is exclusively for Australians aged 55 and over.", variant: "destructive" });
    return;
  }

  setIsLoading(true);
  try {
    // Save to localStorage so finish-login can create the profile
    localStorage.setItem("pendingSignup", JSON.stringify({
      fullName: formData.fullName,
      email: formData.email,
      dateOfBirth: formData.dateOfBirth,
      age: age,
      role: role,
    }));

    // Send magic link
    await sendMagicLink(formData.email);

    toast({
      title: "Check your email!",
      description: "Click the link we sent to " + formData.email + " to activate your account.",
    });

    setStep(3);

  } catch (err) {
    localStorage.removeItem("pendingSignup");
    toast({ title: "Registration failed", description: "Please try again.", variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12 bg-background">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Welcome to TribeSilverCircle</h1>
                <p className="text-xl text-muted-foreground">First, tell us how you want to use the platform</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card
                  data-testid="card-role-host"
                  className="cursor-pointer transition-all border-2 hover:border-primary hover:shadow-md rounded-2xl overflow-hidden border-border/50"
                  onClick={() => handleRoleSelect("host")}
                >
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                      <Home className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">I am a Host</h3>
                    <p className="text-lg text-muted-foreground">I have a spare room and want to rent it out.</p>
                  </CardContent>
                </Card>

                <Card
                  data-testid="card-role-seeker"
                  className="cursor-pointer transition-all border-2 hover:border-primary hover:shadow-md rounded-2xl overflow-hidden border-border/50"
                  onClick={() => handleRoleSelect("seeker")}
                >
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">I am a Seeker</h3>
                    <p className="text-lg text-muted-foreground">I am looking for affordable accommodation.</p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-center text-lg mt-10">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)} 
                  className="text-muted-foreground hover:text-foreground pl-0"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" /> Back
                </Button>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Free Account</h1>
                <p className="text-lg text-muted-foreground">
                  Joining as a <span className="font-bold text-foreground capitalize">{role}</span>
                </p>
              </div>

              <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <Button
                    data-testid="button-google-signup"
                    className="w-full h-14 text-lg rounded-xl bg-white hover:bg-gray-50 border border-border text-gray-700 shadow-sm mb-6"
                    onClick={handleGoogleSignup}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Signing up...
                      </>
                    ) : (
                      <>
                        <FcGoogle className="mr-3 h-6 w-6" />
                        Sign up with Google
                      </>
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-4 text-muted-foreground font-medium">or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-lg font-medium">Full Name</Label>
                      <Input
                        data-testid="input-fullname"
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="h-14 text-lg rounded-xl"
                        placeholder="E.g. Margaret Smith"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-lg font-medium">Email Address</Label>
                      <Input
                        data-testid="input-email"
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-14 text-lg rounded-xl"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-lg font-medium">Date of Birth</Label>
                      <Input
                        data-testid="input-dob"
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                        className="h-14 text-lg rounded-xl"
                      />
                      <p className="text-sm text-muted-foreground">You must be 55 or older to join.</p>
                    </div>

                    <div className="flex items-start space-x-3 pt-4 border-t border-border">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: !!checked })}
                        className="mt-1 h-6 w-6 rounded-md"
                      />
                      <Label htmlFor="terms" className="text-base font-normal leading-snug cursor-pointer">
                        I agree to the{" "}
                        <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                      </Label>
                    </div>

                    <Button
                      data-testid="button-create-account"
                      type="submit"
                      className="w-full h-14 text-lg rounded-xl mt-2"
                      disabled={isLoading || !formData.fullName || !formData.email || !formData.dateOfBirth || !formData.agreeToTerms}
                    >
                      {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </CardContent>

                <CardFooter className="bg-muted/30 p-4 flex justify-center border-t border-border/50">
                  <p className="text-base">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          )}
          {step === 3 && (
  <motion.div
    key="step3"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3 }}
    className="max-w-md mx-auto text-center"
  >
    <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
      <CardContent className="p-8 space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-lg text-muted-foreground">
          We sent an activation link to<br />
          <span className="font-bold text-foreground">{formData.email}</span>
        </p>
        <p className="text-base text-muted-foreground">
          Click the link in your email to activate your account. No password needed.
        </p>
        <Button variant="outline" onClick={() => setStep(2)} className="w-full h-12 rounded-xl">
          Use a different email
        </Button>
      </CardContent>
    </Card>
  </motion.div>
)}
        </AnimatePresence>
      </div>
    </div>
  );
}