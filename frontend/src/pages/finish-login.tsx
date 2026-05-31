import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth, MAGIC_LINK_EMAIL_KEY } from "@/lib/auth";
import { getUserProfile, createUserProfile } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function FinishLoginPage() {
  const { setUserProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const completeSignIn = async () => {
      // Check if this is a magic link sign-in
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        console.log("Not a magic link URL, redirecting to login");
        setLocation("/login");
        return;
      }

      let storedEmail = localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
      
      if (!storedEmail) {
        setNeedsEmail(true);
        setIsLoading(false);
        return;
      }

      await handleSignIn(storedEmail);
    };

    completeSignIn();
  }, []);

  const handleSignIn = async (emailToUse: string) => {
    setIsLoading(true);
    try {
      // Complete the sign-in
      const result = await signInWithEmailLink(
        auth,
        emailToUse,
        window.location.href
      );
      
      const fbUser = result.user;
      
      // Check for pending signup
      const pendingSignup = localStorage.getItem("pendingSignup");
      let profile = await getUserProfile(fbUser.uid);
      
      if (!profile && pendingSignup) {
        // Create new profile from pending data
        const signupData = JSON.parse(pendingSignup);
        const newProfile = {
          uid: fbUser.uid,
          email: fbUser.email || emailToUse,
          fullName: signupData.fullName,
          role: signupData.role,
          status: "active" as const,
          dateOfBirth: signupData.dateOfBirth,
          age: signupData.age,
          createdAt: new Date().toISOString(),
          photoUrl: null,
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
        
        await createUserProfile(newProfile);
        profile = newProfile;
        localStorage.removeItem("pendingSignup");
        
        toast({
          title: "Account created!",
          description: "Welcome to TribeSilverCircle!",
        });
        
        setLocation("/profile-setup");
      } else if (profile) {
        setUserProfile(profile);
        toast({
          title: "Welcome back!",
          description: `Hello ${profile.fullName || profile.email}`,
        });
        setLocation(profile.role === "admin" ? "/admin" : "/dashboard");
      } else {
        setLocation("/signup");
      }
      
      localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
      
    } catch (err: any) {
      console.error("Sign-in error:", err);
      toast({
        title: "Sign in failed",
        description: err.message || "The link may have expired. Please request a new one.",
        variant: "destructive",
      });
      setLocation("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await handleSignIn(email);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (needsEmail) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Label>Email Address</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <Button type="submit" className="w-full">Continue</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}