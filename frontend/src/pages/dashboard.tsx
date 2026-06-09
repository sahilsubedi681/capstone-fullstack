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
  getHostStats,
  getListingsByLocation,
  getInterestedListingIds,
  getHostInterests,
  getSeekerInterests,
  getSeekerStats,
  type Listing,
  type HostStats,
  type LocationStats,
  type SeekerInterest,
  type SeekerStats,
  type InterestRecord,
} from "@/lib/firestore";
import type { UserProfile } from "@/lib/auth";
import { Search, MapPin, Home, User as UserIcon, MessageSquare, Eye, Heart, BarChart3, Users, TrendingUp } from "lucide-react";

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
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [hostStats, setHostStats] = useState<HostStats | null>(null)
  const [interestedListingIds, setInterestedListingIds] = useState<Set<string>>(new Set())
  const [hostInterests, setHostInterests] = useState<InterestRecord[]>([])
  const [hostLocations, setHostLocations] = useState<LocationStats[]>([])
  const { toast } = useToast()

  const interestBlockedMessage = "Seekers are interested in this listing. You cannot make changes until interest is cleared."

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
      getHostStats(user.uid),
      getInterestedListingIds(user.uid),
      getHostInterests(user.uid),
      getListingsByLocation(user.uid),
    ]).then(([l, s, stats, interestedIds, interests, locations]) => {
      setListings(Array.isArray(l) ? l : [])
      setSeekers(s)
      setHostStats(stats)
      setInterestedListingIds(interestedIds)
      setHostInterests(interests)
      setHostLocations(locations)
      setLoading(false)
    })
  }, [user.uid])

  const statusTotal = (hostStats?.active ?? 0) + (hostStats?.removed ?? 0)
  const rentChartData = listings.map((listing) => ({
    label: `${listing.suburb}, ${listing.state}`,
    value: listing.rentPerWeek,
  }))
  const interestChartData = listings
    .map((listing) => ({
      label: `${listing.suburb}`,
      value: hostInterests.filter((interest) => interest.listingId === listing.id).length,
    }))
    .filter((item) => item.value > 0)

const handleCreateListing = async (e: React.FormEvent) => {
  e.preventDefault()
  if (editingId && interestedListingIds.has(editingId)) {
    toast({ title: "Cannot edit listing", description: interestBlockedMessage, variant: "destructive" })
    return
  }
  setSaving(true)
  try {
    if (editingId) {
      await listingsApi.update(editingId, {
        ...form,
        rentPerWeek: Number(form.rentPerWeek),
      }, photos.length > 0 ? photos : undefined)
      setListings(listings.map((l) =>
        l.id === editingId
          ? { ...l, ...form, roomSize: form.roomSize as "single" | "double", bathroomType: form.bathroomType as "private" | "shared", rentPerWeek: Number(form.rentPerWeek) }
          : l
      ))
      toast({ title: "Listing updated!" })
    } else {
      const newListing = await listingsApi.create({
        ...form,
        rentPerWeek: Number(form.rentPerWeek),
      }, photos)
      setListings([...listings, newListing])
      toast({ title: "Listing created!", description: "Your room is now live." })
    }

    setShowForm(false)
    setEditingId(null)
    setPhotos([])
    setPhotoPreviews([])
    setForm({
      suburb: "", state: "", roomSize: "single", rentPerWeek: "",
      billsIncluded: false, bathroomType: "shared", furnished: false,
      availableFrom: "", houseRules: "", spareRooms: 1,
    })
  } catch {
    toast({ title: "Failed to save listing", variant: "destructive" })
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Statistics</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatCard title="Total Listings" value={hostStats?.total ?? 0} icon={<Home className="h-5 w-5" />} />
            <DashboardStatCard title="Active Rooms" value={hostStats?.active ?? 0} icon={<TrendingUp className="h-5 w-5" />} />
            <DashboardStatCard title="Inactive Rooms" value={hostStats?.removed ?? 0} icon={<BarChart3 className="h-5 w-5" />} />
            <DashboardStatCard title="Interested Seekers" value={seekers.length} icon={<Users className="h-5 w-5" />} />
          </div>
        )}

        {!loading && hostStats && hostStats.total > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader>
                <CardTitle>Listing Status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusTotal > 0 ? (
                  <DonutChart
                    total={statusTotal}
                    centerLabel="Listings"
                    segments={[
                      { value: hostStats.active, color: "#10b981", label: "Active" },
                      { value: hostStats.removed, color: "#ef4444", label: "Inactive" },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No listing data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader>
                <CardTitle>Rent by Room</CardTitle>
              </CardHeader>
              <CardContent>
                {rentChartData.length > 0 ? (
                  <HorizontalBarChart data={rentChartData} valuePrefix="$" suffix="/wk" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Add a listing to see rent data.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-md">
              <CardHeader>
                <CardTitle>Listings by State</CardTitle>
              </CardHeader>
              <CardContent>
                {hostLocations.length > 0 ? (
                  <HorizontalBarChart
                    data={hostLocations.map((location) => ({
                      label: location.location,
                      value: location.count,
                    }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No location data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && interestChartData.length > 0 && (
          <Card className="rounded-2xl border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Seeker Interest by Room</CardTitle>
            </CardHeader>
            <CardContent>
              <HorizontalBarChart data={interestChartData} />
            </CardContent>
          </Card>
        )}
      </section>

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
                  {interestedListingIds.has(listing.id) && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                      Seekers are interested in this room. Editing, deleting, and status changes are locked until interest is cleared.
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={interestedListingIds.has(listing.id)}
                      onClick={() => {
                        if (interestedListingIds.has(listing.id)) {
                          toast({ title: "Cannot edit listing", description: interestBlockedMessage, variant: "destructive" })
                          return
                        }
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
                    </Button>
                    {listing.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={interestedListingIds.has(listing.id)}
                        onClick={async () => {
                          if (interestedListingIds.has(listing.id)) {
                            toast({ title: "Cannot mark inactive", description: interestBlockedMessage, variant: "destructive" })
                            return
                          }
                          try {
                            await listingsApi.update(listing.id, { status: "removed" })
                            setListings(listings.map((l) =>
                              l.id === listing.id ? { ...l, status: "removed" } : l
                            ))
                            setHostStats((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    active: prev.active - 1,
                                    removed: prev.removed + 1,
                                  }
                                : null
                            )
                            toast({ title: "Room inactive", description: "Your listing is now hidden from seekers." })
                          } catch {
                            toast({ title: "Failed to mark inactive", variant: "destructive" })
                          }
                        }}
                      >
                        Mark Inactive
                      </Button>
                    )}
                    {listing.status === "removed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={interestedListingIds.has(listing.id)}
                        onClick={async () => {
                          if (interestedListingIds.has(listing.id)) {
                            toast({ title: "Cannot mark active", description: interestBlockedMessage, variant: "destructive" })
                            return
                          }
                          try {
                            await listingsApi.update(listing.id, { status: "active" })
                            setListings(listings.map((l) =>
                              l.id === listing.id ? { ...l, status: "active" } : l
                            ))
                            setHostStats((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    active: prev.active + 1,
                                    removed: prev.removed - 1,
                                  }
                                : null
                            )
                            toast({ title: "Room active", description: "Your listing is live again." })
                          } catch {
                            toast({ title: "Failed to mark active", variant: "destructive" })
                          }
                        }}
                      >
                        Mark Active
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      disabled={interestedListingIds.has(listing.id)}
                      onClick={async () => {
                        if (interestedListingIds.has(listing.id)) {
                          toast({ title: "Cannot delete", description: interestBlockedMessage, variant: "destructive" })
                          return
                        }

                        try {
                          await listingsApi.delete(listing.id)
                          setListings(listings.filter((l) => l.id !== listing.id))
                          setHostStats((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  total: prev.total - 1,
                                  active: listing.status === "active" ? prev.active - 1 : prev.active,
                                  removed: listing.status === "removed" ? prev.removed - 1 : prev.removed,
                                }
                              : null
                          )
                          toast({ title: "Listing deleted successfully" })
                        } catch {
                          toast({ title: "Failed to delete", variant: "destructive" })
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
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

                {/* Photo Upload */}
                <div className="space-y-2">
                  <label className="text-base font-medium">Room Photos (up to 5)</label>
                  <p className="text-sm text-muted-foreground">Add clear photos of the room and common areas.</p>

                  <label
                    htmlFor="room-photos"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <svg className="h-8 w-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm font-medium">Click to upload photos</p>
                      <p className="text-xs">JPG or PNG, max 5MB each, up to 5 photos</p>
                    </div>
                    <input
                      id="room-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).slice(0, 5)
                        setPhotos(files)
                        setPhotoPreviews(files.map((f) => URL.createObjectURL(f)))
                      }}
                    />
                  </label>

                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {photoPreviews.map((preview, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden h-24">
                          <img src={preview} alt={`Room ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotos(photos.filter((_, pi) => pi !== i))
                              setPhotoPreviews(photoPreviews.filter((_, pi) => pi !== i))
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
                          >
                            ✕
                          </button>
                          {i === 0 && (
                                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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

      </div>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rooms with interest</span>
              <span className="font-semibold">{interestedListingIds.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average rent</span>
              <span className="font-semibold">
                {listings.length > 0
                  ? `$${Math.round(listings.reduce((sum, listing) => sum + listing.rentPerWeek, 0) / listings.length)}/wk`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Top state</span>
              <span className="font-semibold">{hostLocations[0]?.location ?? "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Interested Seekers</h2>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : seekers.length === 0 ? (
            <Card className="rounded-2xl border-dashed bg-transparent shadow-none">
              <CardContent className="p-8 text-center text-muted-foreground">
                <UserIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No one has expressed interest yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {seekers.map((seeker) => {
                const interest = hostInterests.find((item) => item.seekerId === seeker.uid)
                const interestedListing = listings.find((listing) => listing.id === interest?.listingId)
                return (
                  <Card key={seeker.uid} className="rounded-xl border-border/50 transition-all hover:shadow-md">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-muted overflow-hidden shrink-0">
                          <img
                            src={seeker.photoUrl || `https://i.pravatar.cc/150?u=${seeker.uid}`}
                            alt={seeker.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold truncate">{seeker.fullName}{seeker.age ? `, ${seeker.age}` : ""}</h4>
                            {seeker.verified && (
                              <Badge className="bg-green-500/20 text-green-700 border-none text-xs shrink-0">Verified</Badge>
                            )}
                          </div>
                          {interestedListing && (
                            <p className="text-sm text-muted-foreground truncate">
                              Interested in: {interestedListing.suburb}, {interestedListing.state}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedSeeker(seeker)}>
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
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
  const [interestedRooms, setInterestedRooms] = useState<SeekerInterest[]>([]);
  const [seekerStats, setSeekerStats] = useState<SeekerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "favourites" | "interests">("browse");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expressing, setExpressing] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationStats[]>([]);
  const { toast } = useToast();

  const expressedListingIds = new Set(interestedRooms.map((interest) => interest.listingId));

  useEffect(() => {
    Promise.all([
      listingsApi.getAll(),
      getSavedListingIds(user.uid),
      getListingsByLocation(),
      getSeekerInterests(user.uid),
      getSeekerStats(user.uid),
    ]).then(([l, s, loc, interests, stats]) => {
      setListings(l);
      setSavedIds(s);
      setLocations(loc);
      setInterestedRooms(interests);
      setSeekerStats(stats);
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
    try {
      const isSaved = await toggleSavedListing(user.uid, listingId);
      setSavedIds((prev) =>
        isSaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)
      );
      toast({
        title: isSaved ? "Saved to favourites" : "Removed from favourites",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save listing",
        variant: "destructive",
      });
    }
  };

  const handleExpressInterest = async (listing: Listing) => {
    setExpressing(listing.id);
    try {
      await expressInterest(user.uid, listing.hostId, listing.id);
      const newInterest: SeekerInterest = {
        listingId: listing.id,
        hostId: listing.hostId,
        createdAt: new Date().toISOString(),
        listing,
      };
      const hadHostInterest = interestedRooms.some((interest) => interest.hostId === listing.hostId);
      setInterestedRooms((prev) => [
        ...prev.filter((interest) => interest.hostId !== listing.hostId),
        newInterest,
      ]);
      if (!hadHostInterest) {
        setSeekerStats((stats) => stats ? { ...stats, interestCount: stats.interestCount + 1 } : stats);
      }
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
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">My Activity</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardStatCard title="Favourite Rooms" value={seekerStats?.savedCount ?? 0} icon={<Heart className="h-5 w-5" />} />
            <DashboardStatCard title="Interests Expressed" value={seekerStats?.interestCount ?? 0} icon={<Users className="h-5 w-5" />} />
            <DashboardStatCard title="Rooms Available" value={seekerStats?.availableRooms ?? 0} icon={<Home className="h-5 w-5" />} />
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
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
        <button
          onClick={() => setActiveTab("interests")}
          className={`px-6 py-3 text-lg font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "interests"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Interests
          {interestedRooms.length > 0 && (
            <span className="bg-primary text-primary-foreground text-sm rounded-full px-2 py-0.5">
              {interestedRooms.length}
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

          {/* Popular Locations */}
          {locations.length > 0 && (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Popular Locations</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {locations.slice(0, 5).map((loc) => (
                    <button
                      key={loc.location}
                      onClick={() => setSuburb(loc.location.split(",")[0])}
                      className="p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-center"
                    >
                      <p className="font-semibold text-sm">{loc.location}</p>
                      <p className="text-xs text-muted-foreground">{loc.count} rooms</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                  hasExpressedInterest={expressedListingIds.has(listing.id)}
                  onSave={handleSave}
                  onView={() => setSelectedListing(listing)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Interests Tab */}
      {activeTab === "interests" && (
        <>
          <h2 className="text-2xl font-bold">Rooms I Expressed Interest In</h2>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : interestedRooms.length === 0 ? (
            <Card className="rounded-2xl border-dashed bg-transparent shadow-none">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg mb-2">No interests expressed yet.</p>
                <p className="text-base">Browse rooms and click Express Interest to contact a host.</p>
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
              {interestedRooms.map((interest) => (
                <InterestListingCard
                  key={`${interest.hostId}_${interest.listingId}`}
                  interest={interest}
                  onView={() => interest.listing && setSelectedListing(interest.listing)}
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
            {/* Image Carousel */}
            <div className="h-64 bg-muted relative group">
              {selectedListing.photoUrls && selectedListing.photoUrls.length > 0 ? (
                <>
                  <img
                    src={selectedListing.photoUrls[photoIndex]}
                    alt={`Room photo ${photoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedListing.photoUrls.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIndex((prev) => (prev - 1 + selectedListing.photoUrls!.length) % selectedListing.photoUrls!.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setPhotoIndex((prev) => (prev + 1) % selectedListing.photoUrls!.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ›
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {photoIndex + 1} / {selectedListing.photoUrls.length}
                  </div>
                </>
              ) : selectedListing.photoUrl ? (
                <img
                  src={selectedListing.photoUrl}
                  alt="Room"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Home className="h-12 w-12 text-muted-foreground opacity-30" />
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedListing(null);
                  setPhotoIndex(0);
                }}
                className="absolute top-4 right-4 bg-background/90 rounded-full p-2 hover:bg-background transition-colors"
              >
                ✕
              </button>
              <div className="absolute bottom-4 right-4 bg-background/90 rounded-full px-4 py-1.5 font-bold text-lg">
                ${selectedListing.rentPerWeek}/wk
              </div>
            </div>

            {/* Photo Thumbnails */}
            {selectedListing.photoUrls && selectedListing.photoUrls.length > 1 && (
              <div className="px-8 pt-4 flex gap-2 overflow-x-auto pb-2">
                {selectedListing.photoUrls.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPhotoIndex(idx)}
                    className={`h-16 w-20 rounded-lg flex-shrink-0 overflow-hidden border-2 transition-colors ${
                      idx === photoIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={photo} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

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
                  disabled={expressing === selectedListing.id || expressedListingIds.has(selectedListing.id)}
                >
                  {expressing === selectedListing.id ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  {expressedListingIds.has(selectedListing.id) ? "Interest Sent" : "Express Interest"}
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

function DashboardStatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutChart({
  segments,
  total,
  centerLabel,
}: {
  segments: { value: number; color: string; label: string }[];
  total: number;
  centerLabel: string;
}) {
  const circumference = 314.159;
  let offset = 0;

  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="15" />
            {segments.map((segment) => {
              const dash = total > 0 ? (segment.value / total) * circumference : 0;
              const circle = (
                <circle
                  key={segment.label}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="15"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">{centerLabel}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
            <span className="font-semibold">
              {segment.value} ({total > 0 ? Math.round((segment.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  data,
  valuePrefix = "",
  suffix = "",
}: {
  data: { label: string; value: number }[];
  valuePrefix?: string;
  suffix?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm gap-3">
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="font-semibold shrink-0">
              {valuePrefix}{item.value}{suffix}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InterestListingCard({
  interest,
  onView,
}: {
  interest: SeekerInterest;
  onView: () => void;
}) {
  const listing = interest.listing;

  if (!listing) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-3">
          <Badge variant="outline">Unavailable</Badge>
          <p className="font-semibold">This room is no longer available.</p>
          <p className="text-sm text-muted-foreground">
            Expressed on {new Date(interest.createdAt).toLocaleDateString("en-AU")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden flex flex-col">
      <div className="h-40 bg-muted relative">
        {listing.photoUrl ? (
          <img src={listing.photoUrl} alt="Room" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="h-10 w-10 text-muted-foreground opacity-30" />
          </div>
        )}
        <Badge
          className={`absolute top-3 left-3 border-none ${
            listing.status === "active"
              ? "bg-green-500/90 text-white"
              : "bg-amber-500/90 text-white"
          }`}
        >
          {listing.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>
      <CardContent className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold capitalize mb-1">{listing.roomSize} Room</h3>
        <p className="text-muted-foreground flex items-center gap-1.5 mb-2 text-sm">
          <MapPin className="h-4 w-4" /> {listing.suburb}, {listing.state}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Interest sent on {new Date(interest.createdAt).toLocaleDateString("en-AU")}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Host</p>
            <p className="font-medium">{listing.hostName}</p>
          </div>
          <p className="font-bold text-lg">${listing.rentPerWeek}/wk</p>
        </div>
        <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={onView}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

// Shared listing card component
function ListingCard({
  listing,
  isSaved,
  hasExpressedInterest = false,
  onSave,
  onView,
}: {
  listing: Listing;
  isSaved: boolean;
  hasExpressedInterest?: boolean;
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
        {listing.photoUrls && listing.photoUrls.length > 0 && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            📷 {listing.photoUrls.length} photo{listing.photoUrls.length !== 1 ? "s" : ""}
          </div>
        )}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur rounded-full px-3 py-1 font-bold text-foreground shadow-sm">
          ${listing.rentPerWeek}/wk
        </div>
        {hasExpressedInterest && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-none">
            Interest Sent
          </Badge>
        )}
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
          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
            <img
              src={listing.hostPhotoUrl || `https://i.pravatar.cc/150?u=${listing.hostId}`}
              alt={listing.hostName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium">{listing.hostName}</p>
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