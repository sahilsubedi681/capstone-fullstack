import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CreditCard, Home, Loader2 } from "lucide-react";
import {
  getUserRoomRequests,
  subscribeToRoomRequests,
  updateRoomRequestStatus,
  type RoomRequest,
} from "@/lib/firestore";
import {
  countPendingRequests,
  countUpdatedRequests,
  getSeenRequestTime,
} from "@/hooks/use-notification-signals";
import { NotificationDot } from "@/components/notification-dot";
import type { UserProfile } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface RoomRequestsPanelProps {
  user: UserProfile;
  role: "host" | "seeker";
  onUpdate?: () => void;
}

const statusStyles: Record<RoomRequest["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700",
  confirmed: "bg-green-500/15 text-green-700",
  declined: "bg-red-500/15 text-red-700",
  cancelled: "bg-muted text-muted-foreground",
  refund_requested: "bg-orange-500/15 text-orange-700",
  refunded: "bg-slate-500/15 text-slate-700",
};

function isRequestNew(userId: string, request: RoomRequest, role: "host" | "seeker"): boolean {
  if (role === "host") return request.status === "pending";

  const seenAt = getSeenRequestTime(userId);
  const updatedAt = request.updatedAt || request.createdAt;
  if (request.status === "pending") return false;
  if (!seenAt) return true;
  return new Date(updatedAt).getTime() > new Date(seenAt).getTime();
}

export function RoomRequestsPanel({ user, role, onUpdate }: RoomRequestsPanelProps) {
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToRoomRequests(user.uid, role, (data) => {
      setRequests(data);
      setLoading(false);
    });

    const poll = setInterval(async () => {
      try {
        const data = await getUserRoomRequests(user.uid, role);
        setRequests((prev) => (JSON.stringify(prev) !== JSON.stringify(data) ? data : prev));
      } catch {
        // best-effort
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [user.uid, role]);

  const handleStatusUpdate = async (
    request: RoomRequest,
    status: "confirmed" | "declined" | "cancelled" | "refund_requested" | "refunded"
  ) => {
    setUpdatingId(request.id);
    try {
      const recipientId = role === "host" ? request.seekerId : request.hostId;
      await updateRoomRequestStatus(
        request.id,
        status,
        user.uid,
        user.fullName,
        recipientId,
        request.listingLabel
      );
      const label = status === "refund_requested" ? "Refund requested" : status === "refunded" ? "Refund confirmed" : `Request ${status}`;
      toast({ title: label });
      onUpdate?.();
    } catch {
      toast({ title: "Failed to update request", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const newCount =
    role === "host"
      ? countPendingRequests(requests)
      : countUpdatedRequests(user.uid, requests, role);

  if (loading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  if (requests.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>No visit or booking requests yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {newCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
          <NotificationDot />
          <span>
            {role === "host"
              ? `${newCount} new request${newCount === 1 ? "" : "s"} waiting for your response`
              : `${newCount} request update${newCount === 1 ? "" : "s"} since you last checked`}
          </span>
        </div>
      )}

      {requests.map((request) => {
        const isNew = isRequestNew(user.uid, request, role);
        return (
          <Card
            key={request.id}
            className={`rounded-2xl border-border/50 ${isNew ? "ring-2 ring-green-500/40 bg-green-500/5" : ""}`}
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {request.type === "visit" ? (
                      <Calendar className="h-4 w-4 text-primary" />
                    ) : (
                      <Home className="h-4 w-4 text-primary" />
                    )}
                    <p className="font-semibold capitalize">
                      {request.type === "visit" ? "Room Visit" : "Room Booking"}
                    </p>
                    {isNew && (
                      <Badge className="bg-green-500 text-white border-none text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{request.listingLabel}</p>
                  {role === "host" && (
                    <p className="text-sm mt-1">From: {request.seekerName}</p>
                  )}
                </div>
                <Badge className={`${statusStyles[request.status]} border-none capitalize`}>
                  {request.status === "refund_requested" ? "Refund requested" : request.status === "refunded" ? "Refunded" : request.status}
                </Badge>
              </div>

              <div className="text-sm grid sm:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-xl">
                <p><span className="text-muted-foreground">Date:</span> {new Date(request.scheduledDate).toLocaleDateString("en-AU")}</p>
                <p><span className="text-muted-foreground">Time:</span> {request.scheduledTime}</p>
              </div>

            {request.notes && (
              <p className="text-sm text-muted-foreground">{request.notes}</p>
            )}

            {request.type === "book" && request.paymentStatus === "paid" && request.totalPaid != null && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-green-800 mb-1">
                  <CreditCard className="h-4 w-4" />
                  Simulated payment received · ${request.totalPaid}
                </div>
                <p className="text-muted-foreground text-xs">
                  Rent ({request.rentWeeks ?? 1} wk{(request.rentWeeks ?? 1) > 1 ? "s" : ""}) ${request.firstWeekRent} + bond ${request.bondAmount}
                </p>
              </div>
            )}

              {request.status === "pending" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {role === "host" ? (
                    <>
                      <Button
                        size="sm"
                        className="rounded-lg"
                        disabled={updatingId === request.id}
                        onClick={() => handleStatusUpdate(request, "confirmed")}
                      >
                        {updatingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={updatingId === request.id}
                        onClick={() => handleStatusUpdate(request, "declined")}
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={updatingId === request.id}
                      onClick={() => handleStatusUpdate(request, "cancelled")}
                    >
                      Cancel Request
                    </Button>
                  )}
                </div>
              )}
              {request.status === "refund_requested" && role === "host" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    className="rounded-lg border border-orange-500 text-orange-700"
                    disabled={updatingId === request.id}
                    onClick={() => handleStatusUpdate(request, "refunded")}
                  >
                    Confirm Refund
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
