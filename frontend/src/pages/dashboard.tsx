import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { listingsApi, verificationApi } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getListings,
  getHostListing,
  getInterestedSeekers,
  getDashboardStats,
  toggleSavedListing,
  getSavedListingIds,
  getSavedListings,
  expressInterest,
  updateUserVerification,
  type Listing,
} from "@/lib/firestore";
import type { UserProfile } from "@/lib/auth";
import { Search, MapPin, Home, User as UserIcon, MessageSquare, Eye, Heart } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary/5 py-12 border-b border-border/40">
        <div className="container mx-auto px-4 md:px-8 max-w-screen-xl">
          <h1 data-testid="text-dashboard-greeting" className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {greeting}, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-lg text-muted-foreground">Welcome back to your TribeSilverCircle dashboard.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-screen-xl mt-8">
        <StatsBar user={user} />
        <div className="mt-12">
          {user.role === "host" ? <HostDashboard user={user} /> : <SeekerDashboard user={user} />}
        </div>
      </div>
    </div>
  );
}

function StatsBar({ user }: { user: UserProfile }) {
  const [stats, setStats] = useState<{ profileCompletionPercent: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "rejected" | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    idType: "",
    idNumber: "",
    dateOfBirth: "",
    phone: "",
    address: "",
  });
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      getDashboardStats(user.uid, user.role),
      !user.verified ? verificationApi.getStatus().catch(() => null) : Promise.resolve(null),
    ]).then(([s, v]) => {
      setStats(s);
      if (v?.status) setVerificationStatus(v.status);
      setLoading(false);
    });
  }, [user.uid, user.role, user.verified]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 5MB.", variant: "destructive" });
      return;
    }
    setIdPhoto(file);
    setIdPhotoPreview(URL.createObjectURL(file));
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPhoto) {
      toast({ title: "ID photo required", description: "Please upload a photo of your ID.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await verificationApi.submit({ ...verifyForm, idPhoto });
      setVerificationStatus("pending");
      toast({
        title: "Verification request submitted!",
        description: "Our admin team will review your profile within 1–2 business days.",
      });
      setShowVerifyModal(false);
      setIdPhoto(null);
      setIdPhotoPreview(null);
    } catch {
      toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = user.verified
    ? {
        icon: "text-green-600",
        iconBg: "bg-green-500/20",
        cardExtra: "border-green-500/30 bg-green-500/5",
        label: "Verified",
        sub: <p className="text-sm text-green-600 font-medium">Your profile has been verified by our team.</p>,
      }
    : verificationStatus === "pending"
    ? {
        icon: "text-amber-500",
        iconBg: "bg-amber-500/20",
        cardExtra: "border-amber-500/30 bg-amber-500/5",
        label: "Pending Review",
        sub: <p className="text-sm text-amber-600 font-medium">Your request is being reviewed. We'll update you within 1–2 business days.</p>,
      }
    : verificationStatus === "rejected"
    ? {
        icon: "text-red-500",
        iconBg: "bg-red-500/20",
        cardExtra: "border-red-500/30 bg-red-500/5",
        label: "Verification Failed",
        sub: (
          <div className="space-y-2">
            <p className="text-sm text-red-600 font-medium">Your request was not approved. Please resubmit with correct details.</p>
            <Button size="sm" className="rounded-lg" onClick={() => setShowVerifyModal(true)}>Resubmit Verification</Button>
          </div>
        ),
      }
    : {
        icon: "text-muted-foreground",
        iconBg: "bg-muted",
        cardExtra: "",
        label: "Not Verified",
        sub: <Button size="sm" className="rounded-lg" onClick={() => setShowVerifyModal(true)}>Verify My Profile</Button>,
      };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <Card className={`rounded-2xl border-border/50 shadow-sm ${statusConfig.cardExtra}`}>
          <CardContent className="p-6 flex items-center gap-6">
            <div className={`p-4 rounded-xl ${statusConfig.iconBg}`}>
              <svg className={`h-8 w-8 ${statusConfig.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Profile Status</p>
              <p className="text-xl font-bold mb-2">{statusConfig.label}</p>
              {statusConfig.sub}
            </div>
          </CardContent>
        </Card>
      </div>

      {showVerifyModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {verificationStatus === "rejected" ? "Resubmit Verification" : "Verify Your Profile"}
                  </h2>
                  <p className="text-muted-foreground text-base">
                    {verificationStatus === "rejected"
                      ? "Please correct your details and resubmit. Our team will review again within 1–2 business days."
                      : "Fill in your details below. Our admin team will review and verify your profile within 1–2 business days."}
                  </p>
                </div>
                <button onClick={() => setShowVerifyModal(false)} className="text-muted-foreground hover:text-foreground ml-4">✕</button>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-base font-medium">ID Type</label>
                  <select
                    value={verifyForm.idType}
                    onChange={(e) => setVerifyForm({ ...verifyForm, idType: e.target.value })}
                    required
                    className="w-full h-12 rounded-xl border border-input bg-background px-3 text-base"
                  >
                    <option value="">Select ID type</option>
                    <option value="drivers_licence">Driver's Licence</option>
                    <option value="passport">Passport</option>
                    <option value="medicare">Medicare Card</option>
                    <option value="seniors_card">Seniors Card</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-medium">ID Number</label>
                  <Input
                    placeholder="Enter your ID number"
                    value={verifyForm.idNumber}
                    onChange={(e) => setVerifyForm({ ...verifyForm, idNumber: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-base font-medium">Date of Birth</label>
                  <Input
                    type="date"
                    value={verifyForm.dateOfBirth}
                    onChange={(e) => setVerifyForm({ ...verifyForm, dateOfBirth: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground">You must be 55 or above to use TribeSilverCircle.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="E.g. 0412 345 678"
                    value={verifyForm.phone}
                    onChange={(e) => setVerifyForm({ ...verifyForm, phone: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-base font-medium">Home Address</label>
                  <Input
                    placeholder="E.g. 12 Example Street, Brighton VIC"
                    value={verifyForm.address}
                    onChange={(e) => setVerifyForm({ ...verifyForm, address: e.target.value })}
                    required
                    className="h-12 rounded-xl"
                  />
                </div>

                {/* ID Photo Upload */}
                <div className="space-y-2">
                  <label className="text-base font-medium">
                    Photo of Your ID <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Take a clear photo of your {verifyForm.idType ? verifyForm.idType.replace("_", " ") : "selected ID"} showing your name and details.
                  </p>

                  {/* Upload area */}
                  <label
                    htmlFor="id-photo-upload"
                    className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      idPhotoPreview
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    {idPhotoPreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={idPhotoPreview}
                          alt="ID preview"
                          className="w-full h-full object-contain rounded-xl p-1"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                          <p className="text-white text-sm font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <svg className="h-10 w-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm font-medium">Click to upload ID photo</p>
                        <p className="text-xs">JPG, PNG or HEIC — max 5MB</p>
                      </div>
                    )}
                    <input
                      id="id-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>

                  {idPhoto && (
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg text-sm">
                      <span className="text-muted-foreground truncate">{idPhoto.name}</span>
                      <button
                        type="button"
                        onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }}
                        className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/30 rounded-xl text-sm text-muted-foreground">
                  Your information is kept private and secure. It will only be used to verify your age and identity. We will never share your details with third parties.
                </div>

                <Button type="submit" className="w-full h-14 text-lg rounded-xl" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {verificationStatus === "rejected" ? "Resubmit Verification Request" : "Submit Verification Request"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function HostDashboard({ user }: { user: UserProfile }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [seekers, setSeekers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedSeeker, setSelectedSeeker] = useState<UserProfile | null>(null)
  const { toast } = useToast()

  const [form, setForm] = useState({
    suburb: "",
    state: "",
    roomSize: "single",
    rentPerWeek: "",
    billsIncluded: false,
    bathroomType: "shared",
    furnished: false,
    availableFrom: "",
    houseRules: "",
    spareRooms: 1,
  })

  useEffect(() => {
    Promise.all([
      listingsApi.getMine().catch(() => []),
      getInterestedSeekers(user.uid),
    ]).then(([l, s]) => {
      setListings(Array.isArray(l) ? l : [])
      setSeekers(s)
      setLoading(false)
    })
  }, [user.uid])

const handleCreateListing = async (e: React.FormEvent) => {
  e.preventDefault()
  setSaving(true)
  try {
    if (editingId) {
      await listingsApi.update(editingId, {
        ...form,
        rentPerWeek: Number(form.rentPerWeek),
      })
      setListings(listings.map((l) =>
        l.id === editingId
          ? { ...l, ...form, rentPerWeek: Number(form.rentPerWeek) }
          : l
      ))
      toast({ title: "Listing updated!", description: "Your room details have been saved." })
    } else {
      const newListing = await listingsApi.create({
        ...form,
        rentPerWeek: Number(form.rentPerWeek),
      })
      setListings([...listings, newListing])
      toast({ title: "Listing created!", description: "Your room is now live on TribeSilverCircle." })
    }

    setShowForm(false)
    setEditingId(null)
    setForm({
      suburb: "",
      state: "",
      roomSize: "single",
      rentPerWeek: "",
      billsIncluded: false,
      bathroomType: "shared",
      furnished: false,
      availableFrom: "",
      houseRules: "",
      spareRooms: 1,
    })
  } catch {
    toast({ title: "Failed to save listing", description: "Please try again.", variant: "destructive" })
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Listings</h2>
          <Button onClick={() => { setShowForm(true); setEditingId(null) }}>Add New Room</Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : listings.length === 0 ? (
          <Card className="rounded-2xl border-border/50 shadow-md">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-4">You haven't created any listings yet.</p>
              <Button onClick={() => { setShowForm(true); setEditingId(null) }}>Create Your First Listing</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="rounded-2xl border-border/50 shadow-md overflow-hidden">
                <div className="h-32 bg-muted relative flex items-center justify-center">
                  {listing.photoUrl
                    ? <img src={listing.photoUrl} alt="Room" className="w-full h-full object-cover" />
                    : <Home className="h-8 w-8 text-muted-foreground opacity-40" />}
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1 capitalize">{listing.roomSize} Room</h3>
                      <p className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {listing.suburb}, {listing.state}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-primary/20 text-primary border-none capitalize">
                        {listing.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 my-4 py-4 border-y border-border text-sm">
                    <div><p className="text-muted-foreground">Rent</p><p className="font-bold">${listing.rentPerWeek}/wk</p></div>
                    <div><p className="text-muted-foreground">Bills</p><p className="font-bold">{listing.billsIncluded ? "Yes" : "No"}</p></div>
                    <div><p className="text-muted-foreground">Bath</p><p className="font-bold capitalize">{listing.bathroomType}</p></div>
                    <div><p className="text-muted-foreground">Furnished</p><p className="font-bold">{listing.furnished ? "Yes" : "No"}</p></div>
                  </div>
                  {listing.houseRules && <p className="text-sm text-foreground mb-4 line-clamp-2">{listing.houseRules}</p>}
                  <div className="flex gap-2">
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setForm({
      suburb: listing.suburb,
      state: listing.state,
      roomSize: listing.roomSize,
      rentPerWeek: String(listing.rentPerWeek),
      billsIncluded: listing.billsIncluded,
      bathroomType: listing.bathroomType,
      furnished: listing.furnished,
      availableFrom: listing.availableFrom || "",
      houseRules: listing.houseRules || "",
      spareRooms: listing.spareRooms || 1,
    })
    setEditingId(listing.id)
    setShowForm(true)
  }}
>
  Edit
</Button><Button
  variant="outline"
  size="sm"
  className="text-destructive"
  onClick={async () => {
    try {
      await listingsApi.delete(listing.id)
      setListings(listings.filter((l) => l.id !== listing.id))
      toast({ title: "Listing deleted successfully" })
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }}
>
  Delete
</Button>                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showForm && (
          <Card className="rounded-2xl border-border/50 shadow-md">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{editingId ? "Edit Room" : "Add New Room"}</h3>
                <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Button>
              </div>
              <form onSubmit={handleCreateListing} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-base font-medium">Suburb</label>
                    <Input
                      placeholder="E.g. Brighton"
                      value={form.suburb}
                      onChange={(e) => setForm({ ...form, suburb: e.target.value })}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-medium">State</label>
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      required
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 text-base"
                    >
                      <option value="">Select state</option>
                      <option value="VIC">VIC</option>
                      <option value="NSW">NSW</option>
                      <option value="QLD">QLD</option>
                      <option value="WA">WA</option>
                      <option value="SA">SA</option>
                      <option value="TAS">TAS</option>
                      <option value="ACT">ACT</option>
                      <option value="NT">NT</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-base font-medium">Room Size</label>
                    <select
                      value={form.roomSize}
                      onChange={(e) => setForm({ ...form, roomSize: e.target.value })}
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 text-base"
                    >
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-medium">Rent Per Week ($)</label>
                    <Input
                      type="number"
                      placeholder="E.g. 250"
                      value={form.rentPerWeek}
                      onChange={(e) => setForm({ ...form, rentPerWeek: e.target.value })}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-base font-medium">Bathroom</label>
                    <select
                      value={form.bathroomType}
                      onChange={(e) => setForm({ ...form, bathroomType: e.target.value })}
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 text-base"
                    >
                      <option value="shared">Shared</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-base font-medium">Available From</label>
                    <Input
                      type="date"
                      value={form.availableFrom}
                      onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.billsIncluded}
                      onChange={(e) => setForm({ ...form, billsIncluded: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-base font-medium">Bills Included</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.furnished}
                      onChange={(e) => setForm({ ...form, furnished: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-base font-medium">Furnished</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-medium">House Rules</label>
                  <textarea
                    placeholder="E.g. No smoking, no loud music after 9pm..."
                    value={form.houseRules}
                    onChange={(e) => setForm({ ...form, houseRules: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-base resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg rounded-xl"
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {editingId ? "Update Room" : "Create Room"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <h2 className="text-2xl font-bold mt-8">Interested Seekers</h2>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : seekers.length === 0 ? (
          <Card className="rounded-2xl border-dashed bg-transparent shadow-none">
            <CardContent className="p-12 text-center text-muted-foreground">
              <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No one has expressed interest in your listing yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {seekers.map((seeker) => (
              <Card key={seeker.uid} className="rounded-xl border-border/50 transition-all hover:shadow-md">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted overflow-hidden shrink-0">
                    <img
                      src={seeker.photoUrl || `https://i.pravatar.cc/150?u=${seeker.uid}`}
                      alt={seeker.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold">{seeker.fullName}{seeker.age ? `, ${seeker.age}` : ""}</h4>
                      {seeker.verified && (
                        <Badge className="bg-green-500/20 text-green-700 border-none text-xs">✓ Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{seeker.bio || "Looking for a quiet, comfortable home."}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedSeeker(seeker)}>View Profile</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-8">
       <Card className="rounded-2xl border-border/50 shadow-sm">
  <CardHeader><CardTitle className="text-xl">Quick Actions</CardTitle></CardHeader>
  <CardContent className="space-y-3">
    <Button
      variant="outline"
      className="w-full rounded-xl justify-start"
      onClick={() => window.location.href = "/profile-setup"}
    >
      <UserIcon className="mr-2 h-4 w-4" />
      Edit Profile
    </Button>
  </CardContent>
</Card>
      </div>

      {/* Seeker Profile Modal */}
      {selectedSeeker && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSeeker(null)}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Profile</h2>
                <button
                  onClick={() => setSelectedSeeker(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Photo */}
                <div className="flex flex-col items-center">
                  <img
                    src={selectedSeeker.photoUrl || `https://i.pravatar.cc/150?u=${selectedSeeker.uid}`}
                    alt={selectedSeeker.fullName}
                    className="w-24 h-24 rounded-full object-cover mb-3"
                  />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-2xl font-bold">{selectedSeeker.fullName}</h3>
                      {selectedSeeker.verified && (
                        <Badge className="bg-green-500/20 text-green-700 border-none">✓ Verified</Badge>
                      )}
                    </div>
                    {selectedSeeker.age && <p className="text-muted-foreground">Age {selectedSeeker.age}</p>}
                  </div>
                </div>

                {/* Bio */}
                {selectedSeeker.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">About</h4>
                    <p className="text-muted-foreground">{selectedSeeker.bio}</p>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                  {selectedSeeker.gender && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gender</span>
                      <span className="font-medium capitalize">{selectedSeeker.gender}</span>
                    </div>
                  )}
                  {selectedSeeker.suburb && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{selectedSeeker.suburb}, {selectedSeeker.state}</span>
                    </div>
                  )}
                  {selectedSeeker.smokes !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Smokes</span>
                      <span className="font-medium">{selectedSeeker.smokes ? "Yes" : "No"}</span>
                    </div>
                  )}
                  {selectedSeeker.hasPets !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pets</span>
                      <span className="font-medium">{selectedSeeker.hasPets ? "Yes" : "No"}</span>
                    </div>
                  )}
                  {selectedSeeker.lifestyle && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lifestyle</span>
                      <span className="font-medium capitalize">{selectedSeeker.lifestyle}</span>
                    </div>
                  )}
                </div>

                {/* Communication */}
                {selectedSeeker.communicationStyle && (
                  <div>
                    <h4 className="font-semibold mb-2">Communication</h4>
                    <p className="text-muted-foreground">{selectedSeeker.communicationStyle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SeekerDashboard({ user }: { user: UserProfile }) {
  const [suburb, setSuburb] = useState("");
  const [maxRent, setMaxRent] = useState<number | undefined>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "favourites">("browse");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [expressing, setExpressing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      listingsApi.getAll(),
      getSavedListingIds(user.uid)
    ]).then(([l, s]) => {
      setListings(l);
      setSavedIds(s);
      setLoading(false);
    });
  }, [user.uid]);

  const handleSearch = async () => {
    setLoading(true);
    const results = await listingsApi.getAll({
      suburb: suburb || undefined,
      maxRent: maxRent || undefined,
    });
    setListings(results);
    setLoading(false);
  };

  const handleSave = async (listingId: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    
    const isSaved = await toggleSavedListing(user.uid, listingId, listing);
    setSavedIds((prev) =>
      isSaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)
    );
    toast({
      title: isSaved ? "Saved to favourites" : "Removed from favourites",
    });
  };

  const handleExpressInterest = async (listing: Listing) => {
    setExpressing(listing.id);
    try {
      await expressInterest(user.uid, listing.hostId);
      toast({
        title: "Interest expressed!",
        description: `${listing.hostName} has been notified. They will reach out to you soon.`,
      });
      setSelectedListing(null);
    } catch {
      toast({
        title: "Failed to express interest",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setExpressing(null);
    }
  };

  const savedListings = listings.filter((l) => savedIds.includes(l.id));

  return (
    <div className="space-y-8">

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-6 py-3 text-lg font-semibold border-b-2 transition-colors ${
            activeTab === "browse"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Browse Rooms
        </button>
        <button
          onClick={() => setActiveTab("favourites")}
          className={`px-6 py-3 text-lg font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "favourites"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Favourites
          {savedIds.length > 0 && (
            <span className="bg-primary text-primary-foreground text-sm rounded-full px-2 py-0.5">
              {savedIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === "browse" && (
        <>
          <Card className="rounded-2xl border-border/50 shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by suburb or postcode"
                    className="pl-10 h-14 text-lg rounded-xl"
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select onValueChange={(val) => setMaxRent(val === "any" ? undefined : Number(val))}>
                    <SelectTrigger className="h-14 text-lg rounded-xl">
                      <SelectValue placeholder="Max Rent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="200">$200/wk</SelectItem>
                      <SelectItem value="300">$300/wk</SelectItem>
                      <SelectItem value="400">$400/wk</SelectItem>
                      <SelectItem value="500">$500/wk</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold">Available Rooms</h2>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="rounded-2xl overflow-hidden">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="rounded-2xl border-dashed bg-transparent shadow-none">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No listings found. Try adjusting your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedIds.includes(listing.id)}
                  onSave={handleSave}
                  onView={() => setSelectedListing(listing)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Favourites Tab */}
      {activeTab === "favourites" && (
        <>
          <h2 className="text-2xl font-bold">My Favourite Rooms</h2>
          {savedListings.length === 0 ? (
            <Card className="rounded-2xl border-dashed bg-transparent shadow-none">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg mb-2">No favourites yet.</p>
                <p className="text-base">Click the heart icon on any listing to save it here.</p>
                <Button
                  variant="outline"
                  className="mt-6 rounded-xl"
                  onClick={() => setActiveTab("browse")}
                >
                  Browse Rooms
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={true}
                  onSave={handleSave}
                  onView={() => setSelectedListing(listing)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="h-56 bg-muted relative">
              {selectedListing.photoUrl ? (
                <img
                  src={selectedListing.photoUrl}
                  alt="Room"
                  className="w-full h-full object-cover rounded-t-2xl"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Home className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
              )}
              <button
                onClick={() => setSelectedListing(null)}
                className="absolute top-4 right-4 bg-background/90 rounded-full p-2 hover:bg-background transition-colors"
              >
                ✕
              </button>
              <div className="absolute bottom-4 right-4 bg-background/90 rounded-full px-4 py-1.5 font-bold text-lg">
                ${selectedListing.rentPerWeek}/wk
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Title and location */}
              <div>
                <h2 className="text-2xl font-bold capitalize mb-1">
                  {selectedListing.roomSize} Room
                </h2>
                <p className="text-muted-foreground flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  {selectedListing.suburb}, {selectedListing.state}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 p-5 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bills</p>
                  <p className="font-semibold text-lg">
                    {selectedListing.billsIncluded ? "Included" : "Not included"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bathroom</p>
                  <p className="font-semibold text-lg capitalize">{selectedListing.bathroomType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Furnished</p>
                  <p className="font-semibold text-lg">{selectedListing.furnished ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available From</p>
                  <p className="font-semibold text-lg">
                    {selectedListing.availableFrom
                      ? new Date(selectedListing.availableFrom).toLocaleDateString("en-AU")
                      : "Now"}
                  </p>
                </div>
              </div>

              {/* House rules */}
              {selectedListing.houseRules && (
                <div>
                  <h3 className="font-bold text-lg mb-2">House Rules</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedListing.houseRules}
                  </p>
                </div>
              )}

              {/* Host info */}
              <div className="flex items-center gap-4 p-4 border border-border rounded-xl">
                <img
                  src={selectedListing.hostPhotoUrl || `https://i.pravatar.cc/150?u=${selectedListing.hostId}`}
                  alt="Host"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{selectedListing.hostName}</p>
                  </div>
                  <p className="text-muted-foreground">
                    Host · Age {selectedListing.hostAge || "55+"}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-lg rounded-xl"
                  onClick={() => handleSave(selectedListing.id)}
                >
                  <Heart
                    className={`mr-2 h-5 w-5 ${
                      savedIds.includes(selectedListing.id)
                        ? "fill-red-500 text-red-500"
                        : ""
                    }`}
                  />
                  {savedIds.includes(selectedListing.id) ? "Saved" : "Save"}
                </Button>
                <Button
                  className="flex-1 h-14 text-lg rounded-xl"
                  onClick={() => handleExpressInterest(selectedListing)}
                  disabled={expressing === selectedListing.id}
                >
                  {expressing === selectedListing.id ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  Express Interest
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                When you express interest the host will be notified and can reach out to you directly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared listing card component
function ListingCard({
  listing,
  isSaved,
  onSave,
  onView,
}: {
  listing: Listing;
  isSaved: boolean;
  onSave: (id: string) => void;
  onView: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm transition-all hover:shadow-md overflow-hidden flex flex-col">
      <div className="h-48 bg-muted relative">
        {listing.photoUrl ? (
          <img
            src={listing.photoUrl}
            alt="Room"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="h-10 w-10 text-muted-foreground opacity-30" />
          </div>
        )}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur rounded-full px-3 py-1 font-bold text-foreground shadow-sm">
          ${listing.rentPerWeek}/wk
        </div>
      </div>
      <CardContent className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-1 capitalize">{listing.roomSize} Room</h3>
        <p className="text-muted-foreground flex items-center gap-1.5 mb-3 text-sm">
          <MapPin className="h-4 w-4" /> {listing.suburb}, {listing.state}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {listing.billsIncluded && (
            <span className="bg-muted/60 rounded-full px-3 py-1 text-sm">💡 Bills incl.</span>
          )}
          <span className="bg-muted/60 rounded-full px-3 py-1 text-sm capitalize">
            🛁 {listing.bathroomType}
          </span>
          {listing.furnished && (
            <span className="bg-muted/60 rounded-full px-3 py-1 text-sm">🛋️ Furnished</span>
          )}
        </div>
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-xl">
          <img
            src={listing.hostPhotoUrl || `https://i.pravatar.cc/150?u=${listing.hostId}`}
            alt="Host"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium">Hosted by {listing.hostName}</p>
            <p className="text-xs text-muted-foreground">Age {listing.hostAge || "55+"}</p>
          </div>
        </div>
        <div className="mt-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onView}
          >
            View Details
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl shrink-0 border border-border"
            onClick={() => onSave(listing.id)}
          >
            <Heart
              className={`h-5 w-5 ${
                isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
              }`}
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}