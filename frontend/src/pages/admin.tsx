import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminApi,
  type AdminStats,
  type AdminUser,
  type AdminListing,
  type AdminActivity,
  type AdminUserDetails,
} from "@/lib/api";
import { Users, Home, Activity, CheckCircle, DoorOpen, CalendarCheck, ShieldCheck, ShieldX, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

const PAGE_SIZE = 8

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") return <Redirect href="/" />;

  return <AdminContent />;
}

function AdminContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);

  const [listings, setListings] = useState<AdminListing[]>([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [listingsPage, setListingsPage] = useState(1);

  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getUsers(usersPage, PAGE_SIZE),
      adminApi.getListings(listingsPage, PAGE_SIZE),
      adminApi.getActivity(activitiesPage, PAGE_SIZE),
    ])
      .then(([s, u, l, a]) => {
        setStats(s);
        setUsers(u.items);
        setUsersTotal(u.total);
        setListings(l.items);
        setListingsTotal(l.total);
        setActivities(a.items);
        setActivitiesTotal(a.total);
      })
      .catch(() => {
        toast({ title: "Failed to load admin data", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    adminApi.getUsers(usersPage, PAGE_SIZE)
      .then((result) => {
        setUsers(result.items)
        setUsersTotal(result.total)
      })
      .catch(() => {
        toast({ title: "Failed to load users", variant: "destructive" })
      })
  }, [usersPage])

  useEffect(() => {
    adminApi.getListings(listingsPage, PAGE_SIZE)
      .then((result) => {
        setListings(result.items)
        setListingsTotal(result.total)
      })
      .catch(() => {
        toast({ title: "Failed to load listings", variant: "destructive" })
      })
  }, [listingsPage])

  useEffect(() => {
    adminApi.getActivity(activitiesPage, PAGE_SIZE)
      .then((result) => {
        setActivities(result.items)
        setActivitiesTotal(result.total)
      })
      .catch(() => {
        toast({ title: "Failed to load activity", variant: "destructive" })
      })
  }, [activitiesPage])

  const handleUserStatus = async (uid: string, status: "active" | "suspended") => {
    setActionLoading(`status-${uid}`);
    try {
      await adminApi.updateUserStatus(uid, status);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, status } : u)));
      toast({ title: `User ${status === "active" ? "approved" : "suspended"}` });
    } catch {
      toast({ title: "Failed to update user status", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (uid: string, verified: boolean) => {
    setActionLoading(`verify-${uid}`);
    try {
      await adminApi.verifyUser(uid, verified);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, verified, verificationStatus: verified ? "approved" : "rejected" }
            : u
        )
      );
      toast({ title: verified ? "Profile verified" : "Profile unverified" });
    } catch {
      toast({ title: "Failed to update verification", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (uid: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setUserDetails(null);
    try {
      const details = await adminApi.getUserDetails(uid);
      setUserDetails(details);
    } catch {
      toast({ title: "Failed to load user details", variant: "destructive" });
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleListingStatus = async (id: string, status: "active" | "removed") => {
    setActionLoading(`listing-${id}`);
    try {
      await adminApi.updateListingStatus(id, status);
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      if (stats) {
        const delta = status === "active" ? 1 : -1;
        const wasActive = listings.find((l) => l.id === id)?.status === "active";
        const willBeActive = status === "active";
        let roomsDelta = 0;
        if (wasActive && !willBeActive) roomsDelta = -1;
        if (!wasActive && willBeActive) roomsDelta = 1;
        if (roomsDelta !== 0) {
          setStats({ ...stats, totalRoomsAvailable: stats.totalRoomsAvailable + roomsDelta });
        }
      }
      toast({ title: `Listing ${status === "active" ? "restored" : "removed"}` });
    } catch {
      toast({ title: "Failed to update listing", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 md:px-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard title="Total Users" value={stats?.totalUsers} icon={<Users className="h-5 w-5" />} loading={loading} />
          <StatCard title="Total Hosts" value={stats?.totalHosts} icon={<Home className="h-5 w-5" />} loading={loading} />
          <StatCard title="Total Seekers" value={stats?.totalSeekers} icon={<Activity className="h-5 w-5" />} loading={loading} />
          <StatCard title="New This Week" value={stats?.newThisWeek} icon={<CheckCircle className="h-5 w-5" />} loading={loading} />
          <StatCard title="Rooms Available" value={stats?.totalRoomsAvailable} icon={<DoorOpen className="h-5 w-5" />} loading={loading} />
          <StatCard title="Host Bookings" value={stats?.totalHostBookings} icon={<CalendarCheck className="h-5 w-5" />} loading={loading} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="rounded-xl shadow-sm border-border/50">
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.uid} data-testid={`row-user-${u.uid}`}>
                            <TableCell className="font-medium">{u.fullName}</TableCell>
                            <TableCell className="capitalize">{u.role}</TableCell>
                            <TableCell>
                              {u.verified ? (
                                <Badge className="bg-green-600 hover:bg-green-600">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : u.verificationStatus === "pending" ? (
                                <Badge variant="secondary">Pending</Badge>
                              ) : (
                                <Badge variant="outline">
                                  <ShieldX className="h-3 w-3 mr-1" />
                                  Unverified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.status === "active" ? "default" : "secondary"} className={u.status === "active" ? "bg-primary hover:bg-primary" : ""}>
                                {u.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-AU") : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  data-testid={`button-view-details-${u.uid}`}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(u.uid)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View Details
                                </Button>
                                {u.verified ? (
                                  <Button
                                    data-testid={`button-unverify-${u.uid}`}
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === `verify-${u.uid}`}
                                    onClick={() => handleVerify(u.uid, false)}
                                  >
                                    Unverify
                                  </Button>
                                ) : (
                                  <Button
                                    data-testid={`button-verify-${u.uid}`}
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === `verify-${u.uid}`}
                                    onClick={() => handleVerify(u.uid, true)}
                                  >
                                    Verify
                                  </Button>
                                )}
                                {u.status === "active" ? (
                                  <Button
                                    data-testid={`button-suspend-${u.uid}`}
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    disabled={actionLoading === `status-${u.uid}`}
                                    onClick={() => handleUserStatus(u.uid, "suspended")}
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    data-testid={`button-approve-${u.uid}`}
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === `status-${u.uid}`}
                                    onClick={() => handleUserStatus(u.uid, "active")}
                                  >
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    page={usersPage}
                    pageSize={PAGE_SIZE}
                    total={usersTotal}
                    onPageChange={setUsersPage}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-border/50">
            <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Host</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Rent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((l) => (
                          <TableRow key={l.id} data-testid={`row-listing-${l.id}`}>
                            <TableCell className="font-medium">{l.hostName}</TableCell>
                            <TableCell>{l.suburb}, {l.state}</TableCell>
                            <TableCell>${l.rentPerWeek}/wk</TableCell>
                            <TableCell>
                              <Badge variant={l.status === "active" ? "default" : "secondary"} className={l.status === "active" ? "bg-primary hover:bg-primary" : ""}>
                                {l.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {l.status !== "removed" ? (
                                <Button
                                  data-testid={`button-remove-listing-${l.id}`}
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={actionLoading === `listing-${l.id}`}
                                  onClick={() => handleListingStatus(l.id, "removed")}
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading === `listing-${l.id}`}
                                  onClick={() => handleListingStatus(l.id, "active")}
                                >
                                  Restore
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    page={listingsPage}
                    pageSize={PAGE_SIZE}
                    total={listingsTotal}
                    onPageChange={setListingsPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl shadow-sm border-border/50">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            ) : activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((a) => (
                        <TableRow key={a.id} data-testid={`row-activity-${a.id}`}>
                          <TableCell className="capitalize font-medium">
                            {a.type.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>{a.description}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString("en-AU")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(a.createdAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  page={activitiesPage}
                  pageSize={PAGE_SIZE}
                  total={activitiesTotal}
                  onPageChange={setActivitiesPage}
                />
              </>
            )}
          </CardContent>
        </Card>

        <UserDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          loading={detailsLoading}
          details={userDetails}
        />
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(total, page * pageSize)

  return (
    <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {startItem}–{endItem} of {total}
      </p>
      <Pagination className="w-full md:w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            />
          </PaginationItem>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={pageNumber === page}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={page >= pageCount}
              onClick={() => onPageChange(Math.min(pageCount, page + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value ?? "—"}</span>
    </div>
  );
}

function UserDetailsDialog({
  open,
  onOpenChange,
  loading,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  details: AdminUserDetails | null;
}) {
  const user = details?.user;
  const verification = details?.verificationRequest;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Profile</h3>
              <div className="rounded-lg border border-border/50 p-4">
                {user.photoUrl && (
                  <img
                    src={user.photoUrl}
                    alt={user.fullName}
                    className="h-16 w-16 rounded-full object-cover mb-4"
                  />
                )}
                <DetailRow label="Full Name" value={user.fullName} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Role" value={user.role} />
                <DetailRow label="Account Status" value={user.status} />
                <DetailRow
                  label="Verified"
                  value={user.verified ? "Yes" : user.verificationStatus === "pending" ? "Pending" : "No"}
                />
                <DetailRow label="Phone" value={user.phone} />
                <DetailRow
                  label="Location"
                  value={user.suburb && user.state ? `${user.suburb}, ${user.state}` : user.suburb || user.state}
                />
                <DetailRow label="Gender" value={user.gender} />
                <DetailRow label="Age" value={user.age} />
                <DetailRow label="Bio" value={user.bio} />
                <DetailRow
                  label="Joined"
                  value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-AU", { dateStyle: "medium" }) : undefined}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Verification Request</h3>
              {verification ? (
                <div className="rounded-lg border border-border/50 p-4">
                  <DetailRow label="Status" value={verification.status} />
                  <DetailRow label="ID Type" value={verification.idType} />
                  <DetailRow label="ID Number" value={verification.idNumber} />
                  <DetailRow label="Date of Birth" value={verification.dateOfBirth} />
                  <DetailRow label="Phone" value={verification.phone} />
                  <DetailRow label="Address" value={verification.address} />
                  <DetailRow
                    label="Submitted"
                    value={new Date(verification.submittedAt).toLocaleDateString("en-AU", { dateStyle: "medium" })}
                  />
                  {verification.reviewedAt && (
                    <DetailRow
                      label="Reviewed"
                      value={new Date(verification.reviewedAt).toLocaleDateString("en-AU", { dateStyle: "medium" })}
                    />
                  )}
                  {verification.idPhotoUrl && (
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground mb-2">ID Photo</p>
                      <a href={verification.idPhotoUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={verification.idPhotoUrl}
                          alt="ID verification document"
                          className="max-h-64 rounded-lg border border-border object-contain"
                        />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground rounded-lg border border-border/50 p-4">
                  No verification request submitted.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, icon, loading }: { title: string; value?: number; icon: React.ReactNode; loading: boolean }) {
  return (
    <Card className="rounded-xl shadow-sm border-border/50">
      <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
        <div className="flex justify-between items-center text-muted-foreground">
          <p className="font-medium text-sm">{title}</p>
          {icon}
        </div>
        {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold text-foreground">{value ?? 0}</h3>}
      </CardContent>
    </Card>
  );
}
