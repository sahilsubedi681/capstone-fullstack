import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllUsers,
  getAllListings,
  getActivityLogs,
  updateUserStatus,
  updateListingStatus,
  type Listing,
  type ActivityLog,
} from "@/lib/firestore";
import type { UserProfile } from "@/lib/auth";
import { Users, Home, Activity, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") return <Redirect href="/" />;

  return <AdminContent />;
}

function AdminContent() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getAllUsers(), getAllListings(), getActivityLogs()]).then(([u, l, a]) => {
      setUsers(u);
      setListings(l);
      setActivities(a);
      setLoading(false);
    });
  }, []);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = users.filter((u) => u.createdAt && new Date(u.createdAt) >= oneWeekAgo).length;

  const stats = {
    totalUsers: users.length,
    totalHosts: users.filter((u) => u.role === "host").length,
    totalSeekers: users.filter((u) => u.role === "seeker").length,
    newThisWeek,
  };

  const handleUserStatus = async (uid: string, status: "active" | "suspended") => {
    await updateUserStatus(uid, status);
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, status } : u)));
    toast({ title: `User ${status === "active" ? "approved" : "suspended"}` });
  };

  const handleListingStatus = async (id: string, status: "active" | "removed") => {
    await updateListingStatus(id, status);
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    toast({ title: `Listing ${status === "active" ? "approved" : "removed"}` });
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 md:px-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} loading={loading} />
          <StatCard title="Total Hosts" value={stats.totalHosts} icon={<Home className="h-5 w-5" />} loading={loading} />
          <StatCard title="Total Seekers" value={stats.totalSeekers} icon={<Activity className="h-5 w-5" />} loading={loading} />
          <StatCard title="New This Week" value={stats.newThisWeek} icon={<CheckCircle className="h-5 w-5" />} loading={loading} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="rounded-xl shadow-sm border-border/50">
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
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
                            <Badge variant={u.status === "active" ? "default" : "secondary"} className={u.status === "active" ? "bg-primary hover:bg-primary" : ""}>
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-AU") : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {u.status === "active" ? (
                                <Button
                                  data-testid={`button-suspend-${u.uid}`}
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleUserStatus(u.uid, "suspended")}
                                >
                                  Suspend
                                </Button>
                              ) : (
                                <Button
                                  data-testid={`button-approve-${u.uid}`}
                                  variant="ghost"
                                  size="sm"
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
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-border/50">
            <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              ) : (
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
                                onClick={() => handleListingStatus(l.id, "removed")}
                              >
                                Remove
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((a) => (
                      <TableRow key={a.id} data-testid={`row-activity-${a.id}`}>
                        <TableCell className="capitalize font-medium">{a.type.replace("_", " ")}</TableCell>
                        <TableCell>{a.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-AU")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, loading }: { title: string; value: number; icon: React.ReactNode; loading: boolean }) {
  return (
    <Card className="rounded-xl shadow-sm border-border/50">
      <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
        <div className="flex justify-between items-center text-muted-foreground">
          <p className="font-medium">{title}</p>
          {icon}
        </div>
        {loading ? <Skeleton className="h-8 w-16" /> : <h3 className="text-3xl font-bold text-foreground">{value}</h3>}
      </CardContent>
    </Card>
  );
}
