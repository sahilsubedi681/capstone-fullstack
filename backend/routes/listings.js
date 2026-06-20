import express from "express"
import multer from "multer"
import axios from "axios"
import FormData from "form-data"
import { verifyToken } from "../middleware/auth.js"
import { db } from "../config/firebase.js"

const router = express.Router()

// Store files in memory for IMGBB upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true)
    else cb(new Error("Only images allowed"))
  },
})

// Helper to upload image buffer to IMGBB
async function uploadImageToImgBB(file) {
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY
  if (!IMGBB_API_KEY) {
    throw new Error("IMGBB_API_KEY not configured")
  }

  const form = new FormData()
  form.append("image", file.buffer.toString("base64"))
  form.append("name", `listing_${Date.now()}_${file.originalname}`)

  const response = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    form,
    { headers: form.getHeaders() }
  )

  return response.data.data.url
}

async function deleteSavedListingsForListing(listingId) {
  const snapshot = await db.collection("saved_listings")
    .where("listingId", "==", listingId)
    .get()

  if (snapshot.empty) return

  const batch = db.batch()
  snapshot.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

async function logActivity(type, description) {
  await db.collection("activity_logs").add({
    type,
    description,
    createdAt: new Date().toISOString(),
  })
}

async function hasListingInterests(listingId) {
  const snapshot = await db.collection("interests")
    .where("listingId", "==", listingId)
    .limit(1)
    .get()
  return !snapshot.empty
}

async function removeListing(listingId) {
  await deleteSavedListingsForListing(listingId)
  await db.collection("listings").doc(listingId).delete()
}

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

// Create listing with up to 5 photos
router.post("/", verifyToken, upload.array("photos", 5), async (req, res) => {
  try {
    const {
      suburb, state, spareRooms, roomSize,
      rentPerWeek, billsIncluded, bathroomType,
      furnished, availableFrom, houseRules,
    } = req.body

    if (!suburb || !state || !rentPerWeek || !roomSize) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const userDoc = await db.collection("users").doc(req.user.uid).get()
    const userData = userDoc.data()

    // Upload photos if provided
    let photoUrls = []
    if (req.files && req.files.length > 0) {
      photoUrls = await Promise.all(
        req.files.map((file) => uploadImageToImgBB(file))
      )
    }

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
      billsIncluded: billsIncluded === "true" || billsIncluded === true,
      bathroomType,
      furnished: furnished === "true" || furnished === true,
      availableFrom: availableFrom || null,
      houseRules: houseRules || null,
      photoUrl: photoUrls[0] || null,      // first photo as main
      photoUrls: photoUrls,                 // all photos
      status: "active",
      createdAt: new Date().toISOString(),
    }

    const ref = await db.collection("listings").add(listing)
    await logActivity(
      "room_created",
      `${userData?.fullName || "Host"} created a new listing: ${listing.suburb}, ${listing.state} for $${listing.rentPerWeek}/week`
    )
    res.status(201).json({ id: ref.id, ...listing })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Update listing with up to 5 photos
router.put("/:id", verifyToken, upload.array("photos", 5), async (req, res) => {
  try {
    const doc = await db.collection("listings").doc(req.params.id).get()
    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" })
    }
    if (doc.data().hostId !== req.user.uid) {
      return res.status(403).json({ error: "Not authorised" })
    }

    const updateData = { ...req.body }
    const listingId = req.params.id

    if (await hasListingInterests(listingId)) {
      return res.status(409).json({
        error: "Cannot modify this listing while seekers are interested. Wait until interest is cleared.",
      })
    }

    const currentStatus = doc.data().status

    if (updateData.status === "removed") {
      if (currentStatus === "booked") {
        return res.status(409).json({ error: "Cannot mark a booked listing as inactive. Mark it available first." })
      }
      await deleteSavedListingsForListing(listingId)
      await db.collection("listings").doc(listingId).update({ status: "removed" })
      return res.json({ message: "Listing marked as inactive" })
    }

    if (updateData.status === "active") {
      await db.collection("listings").doc(listingId).update({
        status: "active",
        bookedAt: null,
        bookedBySeekerId: null,
        bookedRequestId: null,
      })
      return res.json({ message: "Listing marked as active" })
    }

    if (currentStatus === "booked") {
      return res.status(409).json({
        error: "Cannot modify a booked listing. Mark it available first.",
      })
    }

    // Upload new photos if provided
    if (req.files && req.files.length > 0) {
      const photoUrls = await Promise.all(
        req.files.map((file) => uploadImageToImgBB(file))
      )
      updateData.photoUrl = photoUrls[0]
      updateData.photoUrls = photoUrls
    }

    // Fix boolean fields from form data
    if (updateData.billsIncluded !== undefined) {
      updateData.billsIncluded = updateData.billsIncluded === "true" || updateData.billsIncluded === true
    }
    if (updateData.furnished !== undefined) {
      updateData.furnished = updateData.furnished === "true" || updateData.furnished === true
    }
    if (updateData.rentPerWeek !== undefined) {
      updateData.rentPerWeek = Number(updateData.rentPerWeek)
    }

    delete updateData.status

    await db.collection("listings").doc(listingId).update(updateData)
    res.json({ message: "Listing updated successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection("listings").doc(req.params.id).get()
    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" })
    }
    if (doc.data().hostId !== req.user.uid) {
      return res.status(403).json({ error: "Not authorised" })
    }

    if (doc.data().status === "booked") {
      return res.status(409).json({
        error: "Cannot delete a booked listing. Mark it available first.",
      })
    }

    if (await hasListingInterests(req.params.id)) {
      return res.status(409).json({
        error: "Cannot delete this listing while seekers are interested. Wait until interest is cleared.",
      })
    }

    await removeListing(req.params.id)
    res.json({ message: "Listing deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

export default router