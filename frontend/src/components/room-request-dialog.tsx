import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Home, CreditCard, ShieldCheck, ArrowLeft } from "lucide-react";
import { createRoomRequest, type RoomRequestType } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@/lib/firestore";

interface RoomRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: RoomRequestType;
  listing: Listing;
  seekerId: string;
  seekerName: string;
  onSuccess?: () => void;
}

type BookStep = "details" | "payment" | "processing";

const RENT_WEEK_OPTIONS = [1, 2, 3, 4] as const;
type RentWeeks = (typeof RENT_WEEK_OPTIONS)[number];

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function RoomRequestDialog({
  open,
  onOpenChange,
  type,
  listing,
  seekerId,
  seekerName,
  onSuccess,
}: RoomRequestDialogProps) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookStep, setBookStep] = useState<BookStep>("details");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [rentWeeks, setRentWeeks] = useState<RentWeeks>(1);
  const { toast } = useToast();

  const listingLabel = `${listing.roomSize} room in ${listing.suburb}, ${listing.state}`;
  const upfrontRent = listing.rentPerWeek * rentWeeks;
  const bondAmount = listing.rentPerWeek * 4;
  const totalPayment = upfrontRent;

  const title = type === "visit" ? "Schedule a Room Visit" : "Book This Room";
  const description =
    type === "visit"
      ? "Choose a date and time to visit the room. The host will confirm your visit."
      : bookStep === "details"
        ? "Choose your move-in date and time, then complete the simulated payment."
        : bookStep === "payment"
          ? "Review your payment summary. This is a demo — no real charges are made."
          : "Processing your simulated payment...";

  const resetForm = () => {
    setScheduledDate("");
    setScheduledTime("");
    setNotes("");
    setBookStep("details");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setRentWeeks(1);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const submitRequest = async (payment?: {
    rentPerWeek: number;
    rentWeeks: number;
    firstWeekRent: number;
    bondAmount: number;
    totalPaid: number;
    paidAt: string;
  }) => {
    await createRoomRequest({
      seekerId,
      seekerName,
      hostId: listing.hostId,
      listingId: listing.id,
      listingLabel,
      type,
      scheduledDate,
      scheduledTime,
      notes: notes || null,
      ...(payment && {
        paymentStatus: "paid" as const,
        rentPerWeek: payment.rentPerWeek,
        rentWeeks: payment.rentWeeks,
        firstWeekRent: payment.firstWeekRent,
        bondAmount: payment.bondAmount,
        totalPaid: payment.totalPaid,
        paidAt: payment.paidAt,
      }),
    });
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime) {
      toast({ title: "Date and time required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await submitRequest();
      toast({
        title: "Visit request sent",
        description: "The host has been notified and can confirm via messages.",
      });
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailsContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime) {
      toast({ title: "Date and time required", variant: "destructive" });
      return;
    }
    if (type === "book") {
      setBookStep("payment");
      return;
    }
    handleVisitSubmit(e);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\s/g, "");
    if (!cardName.trim() || digits.length < 16 || !cardExpiry || cardCvv.length < 3) {
      toast({ title: "Please fill in all payment details", variant: "destructive" });
      return;
    }

    setBookStep("processing");
    setSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 2200));

    try {
      await submitRequest({
        rentPerWeek: listing.rentPerWeek,
        rentWeeks,
        firstWeekRent: upfrontRent,
        bondAmount,
        totalPaid: totalPayment,
        paidAt: new Date().toISOString(),
      });
      toast({
        title: "Payment successful (simulated)",
        description: "Your booking request has been sent to the host for confirmation.",
      });
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setBookStep("payment");
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "visit" ? <Calendar className="h-5 w-5" /> : <Home className="h-5 w-5" />}
            {title}
            {type === "book" && bookStep !== "details" && (
              <Badge variant="outline" className="text-xs font-normal">Simulated Payment</Badge>
            )}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {type === "visit" || bookStep === "details" ? (
          <form onSubmit={handleDetailsContinue} className="space-y-4">
            <div className="rounded-xl bg-muted/40 p-3 text-sm">
              <p className="font-medium capitalize">{listing.roomSize} Room</p>
              <p className="text-muted-foreground">{listing.suburb}, {listing.state} · ${listing.rentPerWeek}/wk</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="request-date">Date</Label>
                <Input
                  id="request-date"
                  type="date"
                  value={scheduledDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-time">Time</Label>
                <Input
                  id="request-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="request-notes">Notes (optional)</Label>
              <Textarea
                id="request-notes"
                placeholder={type === "visit" ? "Any questions for the host..." : "Tell the host about your move-in plans..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {type === "book" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Booking Duration</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {RENT_WEEK_OPTIONS.map((weeks) => (
                      <Button
                        key={weeks}
                        type="button"
                        variant={rentWeeks === weeks ? "default" : "outline"}
                        className="h-10 rounded-lg"
                        onClick={() => setRentWeeks(weeks)}
                      >
                        {weeks} wk{weeks > 1 ? "s" : ""}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Payment preview</p>
                  <div className="flex justify-between">
                    <span>Rent ({rentWeeks} week{rentWeeks > 1 ? "s" : ""})</span>
                    <span>${upfrontRent}</span>
                  </div>
                  {/* <div className="flex justify-between"><span>Bond (4 weeks)</span><span>${bondAmount}</span></div> */}
                  <div className="flex justify-between font-semibold text-foreground mt-2 pt-2 border-t">
                    <span>Total (simulated)</span><span>${totalPayment}</span>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === "visit" ? "Request Visit" : "Continue to Payment"}
            </Button>
          </form>
        ) : bookStep === "payment" ? (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-primary font-medium mb-2">
                <CreditCard className="h-4 w-4" />
                Payment Summary
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rent ({rentWeeks} week{rentWeeks > 1 ? "s" : ""})</span>
                <span>${upfrontRent}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bond deposit</span><span>${bondAmount}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total due</span><span>${totalPayment}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="card-name">Name on card</Label>
                <Input
                  id="card-name"
                  placeholder="Full name"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-number">Card number</Label>
                <Input
                  id="card-number"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="card-expiry">Expiry</Label>
                  <Input
                    id="card-expiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    maxLength={5}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card-cvv">CVV</Label>
                  <Input
                    id="card-cvv"
                    placeholder="123"
                    value={cardCvv}
                    maxLength={4}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-800">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>This is a simulated payment for demo purposes. No real money will be charged.</span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setBookStep("details")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={submitting}>
                Pay ${totalPayment} (Simulated)
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <p className="font-semibold">Processing payment...</p>
              <p className="text-sm text-muted-foreground mt-1">Simulating secure payment gateway</p>
            </div>
            <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
