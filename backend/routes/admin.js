import express from "express"
import { verifyToken, requireAdmin } from "../middleware/auth.js"
import { db } from "../config/firebase.js"

const router = express.Router()

router.use(verifyToken, requireAdmin)

router.get("/stats", async (req, res) => {
  try {
    const [usersSnap, listingsSnap, bookingsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("listings").get(),
      db.collection("room_requests").where("type", "==", "book").get(),
    ])

    const users = usersSnap.docs.map((doc) => doc.data())
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const listings = listingsSnap.docs.map((doc) => doc.data())
    const bookings = bookingsSnap.docs.map((doc) => doc.data())

    res.json({
      totalUsers: users.length,
      totalHosts: users.filter((u) => u.role === "host").length,
      totalSeekers: users.filter((u) => u.role === "seeker").length,
      newThisWeek: users.filter(
        (u) => u.createdAt && new Date(u.createdAt) >= oneWeekAgo
      ).length,
      totalRoomsAvailable: listings.filter((l) => l.status === "active").length,
      totalHostBookings: bookings.length,
      confirmedHostBookings: bookings.filter((b) => b.status === "confirmed").length,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load stats" })
  }
})

router.get("/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get()
    const users = snapshot.docs
      .map((doc) => ({ uid: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
    res.json({ users })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load users" })
  }
})

router.get("/users/:uid/details", async (req, res) => {
  try {
    const [userSnap, verifySnap] = await Promise.all([
      db.collection("users").doc(req.params.uid).get(),
      db.collection("verification_requests").doc(req.params.uid).get(),
    ])

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      user: { uid: userSnap.id, ...userSnap.data() },
      verificationRequest: verifySnap.exists ? verifySnap.data() : null,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load user details" })
  }
})

router.patch("/users/:uid/verify", async (req, res) => {
  try {
    const { verified } = req.body

    if (typeof verified !== "boolean") {
      return res.status(400).json({ error: "verified must be a boolean" })
    }

    const userRef = db.collection("users").doc(req.params.uid)
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    await userRef.update({
      verified,
      verificationStatus: verified ? "approved" : "rejected",
    })

    const verifyRef = db.collection("verification_requests").doc(req.params.uid)
    const verifySnap = await verifyRef.get()
    if (verifySnap.exists) {
      await verifyRef.update({
        status: verified ? "approved" : "rejected",
        reviewedAt: new Date().toISOString(),
      })
    }

    res.json({ message: verified ? "Profile verified" : "Profile unverified" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update verification" })
  }
})

router.patch("/users/:uid/status", async (req, res) => {
  try {
    const { status } = req.body

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Status must be active or suspended" })
    }

    const userRef = db.collection("users").doc(req.params.uid)
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    await userRef.update({ status })
    res.json({ message: `User ${status === "active" ? "approved" : "suspended"}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update user status" })
  }
})

router.get("/listings", async (req, res) => {
  try {
    const snapshot = await db.collection("listings").get()
    const listings = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
    res.json({ listings })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load listings" })
  }
})

router.patch("/listings/:id/status", async (req, res) => {
  try {
    const { status } = req.body

    if (!["active", "removed"].includes(status)) {
      return res.status(400).json({ error: "Status must be active or removed" })
    }

    const listingRef = db.collection("listings").doc(req.params.id)
    const listingSnap = await listingRef.get()

    if (!listingSnap.exists) {
      return res.status(404).json({ error: "Listing not found" })
    }

    await listingRef.update({ status })
    res.json({ message: `Listing ${status === "active" ? "restored" : "removed"}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to update listing status" })
  }
})

router.get("/activity", async (req, res) => {
  try {
    const snapshot = await db
      .collection("activity_logs")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get()

    const activities = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.json({ activities })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load activity" })
  }
})

export default router
