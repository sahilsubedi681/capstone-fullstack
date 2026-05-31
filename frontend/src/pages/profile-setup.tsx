import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { updateUserProfile, createListing } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [isSaving, setIsSaving] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    gender: "",
    suburb: "",
    state: "",
    phone: "",
    bio: "",
  });

  const [lifestyle, setLifestyle] = useState({
    smokes: false,
    hasPets: false,
    lifestyle: "",
    comfortableWithVisitors: true,
    communicationStyle: "",
  });

  const [hostPrefs, setHostPrefs] = useState({
    spareRooms: 1,
    roomSize: "",
    rentPerWeek: "",
    billsIncluded: false,
    bathroomType: "",
    furnished: true,
    availableFrom: "",
    houseRules: "",
  });

  const [seekerPrefs, setSeekerPrefs] = useState({
    maxBudget: "",
    preferredSuburb: "",
    needAccommodationFrom: "",
    additionalInfo: "",
  });

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  if (!user) return null;

  const handleNext = async () => {
    setIsSaving(true);
    try {
      if (step === 1) {
        await updateUserProfile(user.uid, {
          gender: basicInfo.gender as "male" | "female" | "prefer_not_to_say" | undefined,
          suburb: basicInfo.suburb,
          state: basicInfo.state,
          phone: basicInfo.phone,
          bio: basicInfo.bio,
        });
        setStep(2);
      } else if (step === 2) {
        await updateUserProfile(user.uid, {
          smokes: lifestyle.smokes,
          hasPets: lifestyle.hasPets,
          lifestyle: lifestyle.lifestyle as "early_bird" | "night_owl" | undefined,
          comfortableWithVisitors: lifestyle.comfortableWithVisitors,
          communicationStyle: lifestyle.communicationStyle as "phone_call" | "text_message" | "email" | undefined,
        });
        setStep(3);
      } else if (step === 3) {
        if (user.role === "host") {
          await createListing({
            hostId: user.uid,
            hostName: user.fullName,
            hostAge: user.age || null,
            hostPhotoUrl: user.photoUrl || null,
            suburb: basicInfo.suburb || user.suburb || "Unknown",
            state: basicInfo.state || user.state || "Unknown",
            spareRooms: hostPrefs.spareRooms,
            roomSize: (hostPrefs.roomSize || "single") as "single" | "double",
            rentPerWeek: Number(hostPrefs.rentPerWeek) || 200,
            billsIncluded: hostPrefs.billsIncluded,
            bathroomType: (hostPrefs.bathroomType || "shared") as "private" | "shared",
            furnished: hostPrefs.furnished,
            availableFrom: hostPrefs.availableFrom || null,
            houseRules: hostPrefs.houseRules || null,
            photoUrl: null,
            status: "active",
          });
        } else {
          await updateUserProfile(user.uid, {
            bio: seekerPrefs.additionalInfo ? (basicInfo.bio + " " + seekerPrefs.additionalInfo).trim() : basicInfo.bio,
          });
        }
        await refreshProfile();
        toast({ title: "Profile complete!", description: "Welcome to your dashboard." });
        setLocation("/dashboard");
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Set Up Your Profile</h1>
          <p className="text-lg text-muted-foreground">Help others get to know you</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1">
              <Progress value={(step / totalSteps) * 100} className="h-3" />
            </div>
            <span className="text-sm font-medium text-muted-foreground shrink-0">Step {step} of {totalSteps}</span>
          </div>
          <div className="flex gap-2 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span key={i} className={`text-sm font-medium ${i + 1 === step ? "text-primary" : "text-muted-foreground"}`}>
                {i === 0 ? "Basic Info" : i === 1 ? "Lifestyle" : user.role === "host" ? "Room Details" : "Preferences"}
              </span>
            ))}
          </div>
        </div>

        <Card className="border-border/50 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center space-y-3 shrink-0">
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                        {user.photoUrl
                          ? <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                          : <Camera className="h-8 w-8 text-muted-foreground" />
                        }
                      </div>
                      <p className="text-sm text-muted-foreground text-center">A clear photo builds trust</p>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-lg">Gender</Label>
                          <Select value={basicInfo.gender} onValueChange={(val) => setBasicInfo({ ...basicInfo, gender: val })}>
                            <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select gender" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-lg">Phone Number</Label>
                          <Input className="h-12 text-base" value={basicInfo.phone} onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })} placeholder="04xx xxx xxx" />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-lg">Suburb</Label>
                          <Input className="h-12 text-base" value={basicInfo.suburb} onChange={(e) => setBasicInfo({ ...basicInfo, suburb: e.target.value })} placeholder="E.g. Paddington" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-lg">State</Label>
                          <Select value={basicInfo.state} onValueChange={(val) => setBasicInfo({ ...basicInfo, state: val })}>
                            <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select state" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NSW">New South Wales</SelectItem>
                              <SelectItem value="VIC">Victoria</SelectItem>
                              <SelectItem value="QLD">Queensland</SelectItem>
                              <SelectItem value="WA">Western Australia</SelectItem>
                              <SelectItem value="SA">South Australia</SelectItem>
                              <SelectItem value="TAS">Tasmania</SelectItem>
                              <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                              <SelectItem value="NT">Northern Territory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-lg">About Me</Label>
                          <span className="text-sm text-muted-foreground">{basicInfo.bio.length}/200</span>
                        </div>
                        <Textarea
                          className="min-h-[120px] text-base resize-none"
                          placeholder="Write a short introduction about yourself..."
                          maxLength={200}
                          value={basicInfo.bio}
                          onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <h2 className="text-2xl font-bold mb-6">Lifestyle &amp; Preferences</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-lg font-bold">Daily Routine</Label>
                      <RadioGroup value={lifestyle.lifestyle} onValueChange={(val) => setLifestyle({ ...lifestyle, lifestyle: val })} className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                          <RadioGroupItem value="early_bird" id="early" className="w-5 h-5" />
                          <Label htmlFor="early" className="text-base cursor-pointer flex-1">Early Bird</Label>
                        </div>
                        <div className="flex items-center space-x-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                          <RadioGroupItem value="night_owl" id="night" className="w-5 h-5" />
                          <Label htmlFor="night" className="text-base cursor-pointer flex-1">Night Owl</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-bold">Preferred Communication</Label>
                      <RadioGroup value={lifestyle.communicationStyle} onValueChange={(val) => setLifestyle({ ...lifestyle, communicationStyle: val })} className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                          <RadioGroupItem value="phone_call" id="phone_call" className="w-5 h-5" />
                          <Label htmlFor="phone_call" className="text-base cursor-pointer flex-1">Phone Call</Label>
                        </div>
                        <div className="flex items-center space-x-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                          <RadioGroupItem value="text_message" id="text_msg" className="w-5 h-5" />
                          <Label htmlFor="text_msg" className="text-base cursor-pointer flex-1">Text Message</Label>
                        </div>
                        <div className="flex items-center space-x-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                          <RadioGroupItem value="email" id="email_pref" className="w-5 h-5" />
                          <Label htmlFor="email_pref" className="text-base cursor-pointer flex-1">Email</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <Label className="text-lg font-bold">House Preferences</Label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox id="smokes" checked={lifestyle.smokes} onCheckedChange={(c) => setLifestyle({ ...lifestyle, smokes: !!c })} className="w-5 h-5" />
                        <Label htmlFor="smokes" className="text-base cursor-pointer">I smoke</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="pets" checked={lifestyle.hasPets} onCheckedChange={(c) => setLifestyle({ ...lifestyle, hasPets: !!c })} className="w-5 h-5" />
                        <Label htmlFor="pets" className="text-base cursor-pointer">I have pets</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox id="visitors" checked={lifestyle.comfortableWithVisitors} onCheckedChange={(c) => setLifestyle({ ...lifestyle, comfortableWithVisitors: !!c })} className="w-5 h-5" />
                        <Label htmlFor="visitors" className="text-base cursor-pointer">I am comfortable with visitors in the home</Label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && user.role === "host" && (
                <motion.div key="step3-host" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <h2 className="text-2xl font-bold mb-6">Room Details</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-lg">Room Size</Label>
                      <Select value={hostPrefs.roomSize} onValueChange={(val) => setHostPrefs({ ...hostPrefs, roomSize: val })}>
                        <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select size" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single Room</SelectItem>
                          <SelectItem value="double">Double/Queen Room</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-lg">Bathroom</Label>
                      <Select value={hostPrefs.bathroomType} onValueChange={(val) => setHostPrefs({ ...hostPrefs, bathroomType: val })}>
                        <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private (Ensuite)</SelectItem>
                          <SelectItem value="shared">Shared Bathroom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-lg">Rent per week ($)</Label>
                      <Input type="number" className="h-12 text-base" value={hostPrefs.rentPerWeek} onChange={(e) => setHostPrefs({ ...hostPrefs, rentPerWeek: e.target.value })} placeholder="E.g. 250" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-lg">Available From</Label>
                      <Input type="date" className="h-12 text-base" value={hostPrefs.availableFrom} onChange={(e) => setHostPrefs({ ...hostPrefs, availableFrom: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 pt-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox id="furnished" checked={hostPrefs.furnished} onCheckedChange={(c) => setHostPrefs({ ...hostPrefs, furnished: !!c })} className="w-5 h-5" />
                      <Label htmlFor="furnished" className="text-base cursor-pointer">Room is furnished</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox id="bills" checked={hostPrefs.billsIncluded} onCheckedChange={(c) => setHostPrefs({ ...hostPrefs, billsIncluded: !!c })} className="w-5 h-5" />
                      <Label htmlFor="bills" className="text-base cursor-pointer">Bills included in rent</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg">House Rules</Label>
                    <Textarea
                      className="min-h-[100px] text-base"
                      placeholder="E.g., No smoking inside, quiet after 10pm..."
                      value={hostPrefs.houseRules}
                      onChange={(e) => setHostPrefs({ ...hostPrefs, houseRules: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && user.role === "seeker" && (
                <motion.div key="step3-seeker" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <h2 className="text-2xl font-bold mb-6">Accommodation Preferences</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-lg">Maximum Budget ($/week)</Label>
                      <Input type="number" className="h-12 text-base" value={seekerPrefs.maxBudget} onChange={(e) => setSeekerPrefs({ ...seekerPrefs, maxBudget: e.target.value })} placeholder="E.g. 300" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-lg">Preferred Suburb</Label>
                      <Input className="h-12 text-base" value={seekerPrefs.preferredSuburb} onChange={(e) => setSeekerPrefs({ ...seekerPrefs, preferredSuburb: e.target.value })} placeholder="E.g. Newtown" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-lg">Need accommodation from</Label>
                      <Input type="date" className="h-12 text-base" value={seekerPrefs.needAccommodationFrom} onChange={(e) => setSeekerPrefs({ ...seekerPrefs, needAccommodationFrom: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label className="text-lg">Anything else the host should know?</Label>
                    <Textarea
                      className="min-h-[120px] text-base"
                      placeholder="Any specific requirements? (e.g., must be close to public transport, ground floor only...)"
                      value={seekerPrefs.additionalInfo}
                      onChange={(e) => setSeekerPrefs({ ...seekerPrefs, additionalInfo: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-12 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} disabled={isSaving} className="text-lg h-14 px-6 rounded-xl">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
              ) : <div />}

              <Button size="lg" onClick={handleNext} disabled={isSaving} className="text-lg h-14 px-8 rounded-xl">
                {isSaving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {step === totalSteps
                  ? <><Check className="mr-2 h-5 w-5" /> Go to My Dashboard</>
                  : <>Next Step <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
