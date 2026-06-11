import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, getAuthenticatedRedirectPath } from "@/lib/auth";
import { getUserProfile } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const { user, firebaseUser, isLoading, signInWithGoogle, sendMagicLink, setUserProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      setLocation(getAuthenticatedRedirectPath(user));
      return;
    }
    if (firebaseUser) {
      setLocation("/signup");
    }
  }, [isLoading, user, firebaseUser, setLocation]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const profile = await getUserProfile(fbUser.uid);
      if (profile) {
        setUserProfile(profile);
        setLocation(getAuthenticatedRedirectPath(profile));
      } else {
        setLocation("/signup");
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code !== "auth/popup-closed-by-user") {
        toast({ title: "Sign in failed", description: "Could not sign in with Google. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMagicLoading(true);
    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch {
      toast({ title: "Failed to send link", description: "Please check your email and try again.", variant: "destructive" });
    } finally {
      setIsMagicLoading(false);
    }
  };

  if (isLoading || user || firebaseUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Welcome Back</h1>
          <p className="text-lg text-muted-foreground">Sign in to your TribeSilverCircle account</p>
        </div>

        <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-none rounded-t-2xl h-14">
              <TabsTrigger value="google" className="text-base rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign in with Google</TabsTrigger>
              <TabsTrigger value="magic" className="text-base rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Magic Link</TabsTrigger>
            </TabsList>

            <CardContent className="p-6 sm:p-8 pt-8">
              <TabsContent value="google" className="mt-0 space-y-6">
                <p className="text-lg text-muted-foreground text-center">
                  The fastest and most secure way to sign in. No password needed.
                </p>
                <Button
                  data-testid="button-google-signin"
                  className="w-full h-14 text-lg rounded-xl bg-white hover:bg-gray-50 border border-border text-gray-700 shadow-sm"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading
                    ? <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    : <FcGoogle className="mr-3 h-6 w-6" />}
                  Continue with Google
                </Button>
              </TabsContent>

              <TabsContent value="magic" className="mt-0">
                {!magicLinkSent ? (
                  <form onSubmit={handleMagicLink} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="magic-email" className="text-lg font-medium">Email Address</Label>
                      <Input
                        data-testid="input-email-magic"
                        id="magic-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-14 text-lg rounded-xl"
                      />
                      <p className="text-sm text-muted-foreground">We'll email you a one-click sign in link. No password needed.</p>
                    </div>
                    <Button
                      data-testid="button-send-magic-link"
                      type="submit"
                      className="w-full h-14 text-lg rounded-xl"
                      disabled={isMagicLoading || !email}
                    >
                      {isMagicLoading
                        ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                        : <><Mail className="mr-2 h-5 w-5" /> Send Magic Link</>}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">Check your email</h3>
                      <p className="text-lg text-muted-foreground">
                        We've sent a magic link to<br />
                        <span className="font-medium text-foreground">{email}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Click the link in the email to sign in instantly.</p>
                    </div>
                    <Button variant="outline" onClick={() => setMagicLinkSent(false)}>
                      Try another email
                    </Button>
                  </div>
                )}
              </TabsContent>
            </CardContent>

            <CardFooter className="bg-muted/30 p-6 flex justify-center border-t border-border/50">
              <p className="text-lg">
                New to TribeSilverCircle?{" "}
                <Link href="/signup" className="text-primary font-bold hover:underline">Create an account</Link>
              </p>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
