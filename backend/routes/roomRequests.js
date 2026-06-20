import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { db } from "../config/firebase.js"

const router = express.Router()

function conversationId(uid1, uid2) {
  return [uid1, uid2].sort().join("_")
}

async function ensureConversation(userId1, userId2) {
  const convId = conversationId(userId1, userId2)
  const convRef = db.collection("conversations").doc(convId)
  const convSnap = await convRef.get()

  if (!convSnap.exists) {
    await convRef.set({
      participants: [userId1, userId2].sort(),
      listingId: null,
      listingLabel: null,
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
    })
  }

  return convId
}

async function sendMessage(senderId, senderName, recipientId, content) {
  const convId = await ensureConversation(senderId, recipientId)
  const convRef = db.collection("conversations").doc(convId)
  const now = new Date().toISOString()

  await convRef.update({ lastMessage: content, lastMessageAt: now, lastSenderId: senderId })
  await convRef.collection("messages").add({
    conversationId: convId,
    senderId,
    senderName,
    content,
    isRead: false,
    createdAt: now,
  })
}

async function logActivity(type, description) {
  await db.collection("activity_logs").add({
    type,
    description,
    createdAt: new Date().toISOString(),
  })
}

router.get("/", verifyToken, async (req, res) => {
  try {
    const role = req.query.role === "host" ? "host" : "seeker"
    const field = role === "host" ? "hostId" : "seekerId"

    const snapshot = await db.collection("room_requests")
      .where(field, "==", req.user.uid)
      .get()

    const requests = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({ requests })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load room requests" })
  }
})

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      hostId,
      listingId,
      listingLabel,
      type,
      scheduledDate,
      scheduledTime,
      notes,
      seekerName,
      paymentStatus,
      rentPerWeek,
      rentWeeks,
      firstWeekRent,
      bondAmount,
      totalPaid,
      paidAt,
    } = req.body

    if (!hostId || !listingId || !listingLabel || !type || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (!["visit", "book"].includes(type)) {
      return res.status(400).json({ error: "Invalid request type" })
    }

    const listingSnap = await db.collection("listings").doc(listingId).get()
    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found" })
    }

    const listingData = listingSnap.data()
    if (listingData.status !== "active") {
      return res.status(409).json({ error: "This room is no longer available for requests" })
    }

    if (listingData.hostId !== hostId) {
      return res.status(400).json({ error: "Invalid host for this listing" })
    }

    const payload = {
      seekerId: req.user.uid,
      seekerName: seekerName || "User",
      hostId,
      listingId,
      listingLabel,
      type,
      scheduledDate,
      scheduledTime,
      notes: notes || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...(type === "book" && paymentStatus === "paid" && {
        paymentStatus: "paid",
        rentPerWeek: rentPerWeek ?? null,
        rentWeeks: rentWeeks ?? null,
        firstWeekRent: firstWeekRent ?? null,
        bondAmount: bondAmount ?? null,
        totalPaid: totalPaid ?? null,
        paidAt: paidAt ?? new Date().toISOString(),
      }),
    }

    const ref = await db.collection("room_requests").add(payload)
    const typeLabel = type === "visit" ? "room visit" : "room booking"
    const paymentNote =
      type === "book" && payload.totalPaid
        ? ` Simulated payment of $${payload.totalPaid} received.`
        : ""

    await sendMessage(
      req.user.uid,
      payload.seekerName,
      hostId,
      `Requested a ${typeLabel} for ${listingLabel} on ${scheduledDate} at ${scheduledTime}.${paymentNote}`
    )

    await logActivity(
      type === "book" ? "room_booking_request" : "room_visit_request",
      `${payload.seekerName} requested a ${typeLabel} for ${listingLabel} on ${scheduledDate} at ${scheduledTime}`
    )

    res.status(201).json({ request: { id: ref.id, ...payload } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to create room request" })
  }
})

router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ["confirmed", "declined", "cancelled", "refund_requested", "refunded"]

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const ref = db.collection("room_requests").doc(req.params.id)
    const snap = await ref.get()

    if (!snap.exists) {
      return res.status(404).json({ error: "Request not found" })
    }

    const request = snap.data()
    const isHost = request.hostId === req.user.uid
    const isSeeker = request.seekerId === req.user.uid

    if (!isHost && !isSeeker) {
      return res.status(403).json({ error: "Not allowed to update this request" })
    }

    if (status === "cancelled" && !isSeeker) {
      return res.status(403).json({ error: "Only the seeker can cancel a request" })
    }

    if (status === "refund_requested" && !isSeeker) {
      return res.status(403).json({ error: "Only the seeker can request a refund" })
    }

    if (status === "refunded" && !isHost) {
      return res.status(403).json({ error: "Only the host can confirm a refund" })
    }

    if ((status === "confirmed" || status === "declined") && !isHost) {
      return res.status(403).json({ error: "Only the host can confirm or decline a request" })
    }

    if (status === "refund_requested" && request.type !== "book") {
      return res.status(400).json({ error: "Refunds can only be requested for bookings" })
    }

    if (status === "refund_requested" && request.status !== "confirmed") {
      return res.status(409).json({ error: "Refund can only be requested for a confirmed booking" })
    }

    if (status === "refunded" && request.status !== "refund_requested") {
      return res.status(409).json({ error: "Refund confirmation must follow a refund request" })
    }

    const previousStatus = request.status
    const now = new Date().toISOString()

    await ref.update({ status, updatedAt: now })

    if (status === "confirmed" && request.type === "book") {
      await db.collection("listings").doc(request.listingId).update({
        status: "booked",
        bookedAt: now,
        bookedBySeekerId: request.seekerId,
        bookedRequestId: snap.id,
      })
    }

    if (status === "refunded" && request.type === "book") {
      const listingRef = db.collection("listings").doc(request.listingId)
      const listingDoc = await listingRef.get()
      if (listingDoc.exists && listingDoc.data().status === "booked") {
        await listingRef.update({
          status: "active",
          bookedAt: null,
          bookedBySeekerId: null,
          bookedRequestId: null,
        })
      }
    }

    if (
      request.type === "book" &&
      previousStatus === "confirmed" &&
      status === "cancelled"
    ) {
      const listingRef = db.collection("listings").doc(request.listingId)
      const listingDoc = await listingRef.get()
      if (listingDoc.exists && listingDoc.data().status === "booked") {
        await listingRef.update({
          status: "active",
          bookedAt: null,
          bookedBySeekerId: null,
          bookedRequestId: null,
        })
      }
    }

    const recipientId = isHost ? request.seekerId : request.hostId
    const statusLabel =
      status === "confirmed"
        ? "confirmed"
        : status === "declined"
        ? "declined"
        : status === "cancelled"
        ? "cancelled"
        : status === "refund_requested"
        ? "marked for refund"
        : "refunded"
    const userSnap = await db.collection("users").doc(req.user.uid).get()
    const actorName = userSnap.data()?.fullName || "User"

    const bookingNote =
      status === "confirmed" && request.type === "book"
        ? " The room is now marked as booked."
        : status === "refunded"
        ? " The booking has been refunded and the room is available again for seekers."
        : ""

    await sendMessage(
      req.user.uid,
      actorName,
      recipientId,
      `Your ${request.listingLabel} request has been ${statusLabel}.${bookingNote}`
    )

    if (status === "confirmed") {
      await logActivity(
        request.type === "book" ? "booking_confirmed" : "visit_confirmed",
        `${actorName} confirmed ${request.type === "book" ? "booking" : "visit"} for ${request.listingLabel}`
      )
    }

    if (status === "refund_requested") {
      await logActivity(
        "refund_requested",
        `${actorName} requested a refund for ${request.listingLabel}`
      )
    }

    if (status === "refunded") {
      await logActivity(
        "refunded",
        `${actorName} confirmed refund for ${request.listingLabel}`
      )
    }

    if (status === "declined") {
      await logActivity(
        "request_declined",
        `${actorName} declined the request for ${request.listingLabel}`
      )
    }

    if (status === "cancelled") {
      await logActivity(
        "request_cancelled",
        `${actorName} cancelled the request for ${request.listingLabel}`
      )
    }

    res.json({ request: { id: snap.id, ...request, status, updatedAt: now } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update room request" })
  }
})

export default router
