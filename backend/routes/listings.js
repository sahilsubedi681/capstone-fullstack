import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { db } from "../config/firebase.js"

const router = express.Router()

router.get("/host/mine", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("listings")
      .where("hostId", "==", req.user.uid)
      .get()

    if (snapshot.empty) {
      return res.status(200).json({ listings: [] })
    }

    const listings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    res.json({ listings })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get all active listings (public)
router.get("/", async (req, res) => {
  try {
    const { suburb, maxRent } = req.query
    const snapshot = await db.collection("listings")
      .where("status", "==", "active")
      .get()

    let listings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    if (suburb) {
      listings = listings.filter((l) =>
        l.suburb.toLowerCase().includes(suburb.toLowerCase())
      )
    }

    if (maxRent) {
      listings = listings.filter((l) => l.rentPerWeek <= Number(maxRent))
    }

    res.json(listings)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// ✅ Dynamic route LAST
router.get("/:id", async (req, res) => {
  try {
    const doc = await db.collection("listings").doc(req.params.id).get()
    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" })
    }
    res.json({ id: doc.id, ...doc.data() })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Create listing
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      suburb, state, spareRooms, roomSize,
      rentPerWeek, billsIncluded, bathroomType,
      furnished, availableFrom, houseRules, photoUrl,
    } = req.body

    if (!suburb || !state || !rentPerWeek || !roomSize) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const userDoc = await db.collection("users").doc(req.user.uid).get()
    const userData = userDoc.data()

    const listing = {
      hostId: req.user.uid,
      hostName: userData?.fullName || "",
      hostAge: userData?.age || null,
      hostPhotoUrl: userData?.photoUrl || null,
      suburb,
      state,
      spareRooms: Number(spareRooms) || 1,
      roomSize,
      rentPerWeek: Number(rentPerWeek),
      billsIncluded: Boolean(billsIncluded),
      bathroomType,
      furnished: Boolean(furnished),
      availableFrom: availableFrom || null,
      houseRules: houseRules || null,
      photoUrl: photoUrl || null,
      status: "active",
      createdAt: new Date().toISOString(),
    }

    const ref = await db.collection("listings").add(listing)
    res.status(201).json({ id: ref.id, ...listing })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Update listing
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection("listings").doc(req.params.id).get()
    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" })
    }
    if (doc.data().hostId !== req.user.uid) {
      return res.status(403).json({ error: "Not authorised" })
    }
    await db.collection("listings").doc(req.params.id).update(req.body)
    res.json({ message: "Listing updated successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Delete listing
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection("listings").doc(req.params.id).get()
    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" })
    }
    if (doc.data().hostId !== req.user.uid) {
      return res.status(403).json({ error: "Not authorised" })
    }
    await db.collection("listings").doc(req.params.id).update({ status: "removed" })
    res.json({ message: "Listing removed successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

export default router