import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CreditCard, Home, MapPin, User } from "lucide-react";
import {
  getSeekerBookedRooms,
  subscribeToBookedRooms,
  type BookedRoom,
} from "@/lib/firestore";
import type { UserProfile } from "@/lib/auth";

interface BookedRoomsPanelProps {
  user: UserProfile;
  onCountChange?: (count: number) => void;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  confirmed: "bg-green-500/15 text-green-700",
};

export function BookedRoomsPanel({ user, onCountChange }: BookedRoomsPanelProps) {
  const [bookedRooms, setBookedRooms] = useState<BookedRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToBookedRooms(user.uid, (rooms) => {
      setBookedRooms(rooms);
      setLoading(false);
      onCountChange?.(rooms.length);
    });

    const poll = setInterval(async () => {
      try {
        const rooms = await getSeekerBookedRooms(user.uid);
        setBookedRooms((prev) => (JSON.stringify(prev) !== JSON.stringify(rooms) ? rooms : prev));
      } catch {
        // best-effort
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [user.uid]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (bookedRooms.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="p-12 text-center text-muted-foreground">
          <Home className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No booked rooms yet.</p>
          <p className="text-sm mt-2">
            Book a room from your interests and complete the simulated payment to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {bookedRooms.map(({ request, listing }) => {
        const photo = listing?.photoUrls?.[0] || listing?.photoUrl;
        const statusLabel = request.status === "confirmed" ? "Booked" : "Awaiting Host Confirmation";

        return (
          <Card key={request.id} className="rounded-2xl border-border/50 overflow-hidden flex flex-col">
            <div className="h-44 bg-muted relative">
              {photo ? (
                <img src={photo} alt={request.listingLabel} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
              <Badge
                className={`absolute top-3 right-3 border-none ${statusStyles[request.status] || statusStyles.pending}`}
              >
                {statusLabel}
              </Badge>
            </div>

            <CardContent className="p-5 flex-1 flex flex-col gap-3">
              <div>
                <h3 className="text-xl font-bold capitalize">
                  {listing?.roomSize || "Room"} Room
                </h3>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm mt-1">
                  <MapPin className="h-4 w-4" />
                  {listing ? `${listing.suburb}, ${listing.state}` : request.listingLabel}
                </p>
              </div>

              {listing && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Host: {listing.hostName}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm p-3 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(request.scheduledDate).toLocaleDateString("en-AU")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Move-in: </span>
                  {request.scheduledTime}
                </div>
              </div>

              {request.totalPaid != null && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2 font-medium text-green-800">
                    <CreditCard className="h-4 w-4" />
                    Payment Simulated
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Rent ({request.rentWeeks ?? 1} wk{(request.rentWeeks ?? 1) > 1 ? "s" : ""})</span>
                    <span>${request.firstWeekRent}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Bond</span>
                    <span>${request.bondAmount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-green-500/20">
                    <span>Total paid</span>
                    <span>${request.totalPaid}</span>
                  </div>
                  {request.paidAt && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Paid on {new Date(request.paidAt).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  )}
                </div>
              )}

              {listing && (
                <p className="text-sm font-semibold mt-auto">
                  ${listing.rentPerWeek}/week
                  {listing.billsIncluded && (
                    <span className="text-muted-foreground font-normal"> · bills included</span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
