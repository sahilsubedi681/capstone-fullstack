import express from "express"
import multer from "multer"
import axios from "axios"
import FormData from "form-data"
import { verifyToken, requireAdmin } from "../middleware/auth.js"
import { db } from "../config/firebase.js"

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const IMGBB_API_KEY = process.env.IMGBB_API_KEY
// Get all users
router.get("/all", verifyToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get()
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Submit verification request
router.post("/verify", verifyToken, upload.single("idPhoto"), async (req, res) => {
  try {
    const { idType, idNumber, dateOfBirth, phone, address } = req.body

    if (!idType || !idNumber || !dateOfBirth || !phone || !address) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (!req.file) {
      return res.status(400).json({ error: "ID photo is required" })
    }

    // Upload photo to ImgBB
    const formData = new FormData()
    formData.append("image", req.file.buffer.toString("base64"))
    formData.append("name", `verify_${req.user.uid}_${Date.now()}`)

    const imgbbRes = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    )

    const idPhotoUrl = imgbbRes.data.data.url

    await db.collection("verification_requests").doc(req.user.uid).set({
      uid: req.user.uid,
      idType,
      idNumber,
      dateOfBirth,
      phone,
      address,
      idPhotoUrl,
      status: "pending",
      submittedAt: new Date().toISOString(),
    })

    await db.collection("users").doc(req.user.uid).update({
      verificationStatus: "pending",
    })

    res.json({ message: "Verification request submitted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get all verification requests (admin)
router.get("/verify/all", verifyToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("verification_requests").get()
    const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.json(requests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get own verification status
router.get("/verify/status", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection("verification_requests").doc(req.user.uid).get()
    if (!doc.exists) return res.json({ status: null })
    res.json({ status: doc.data()?.status, submittedAt: doc.data()?.submittedAt })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

// Approve or reject verification (admin)
router.put("/verify/:uid", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be approved or rejected" })
    }

    await db.collection("verification_requests").doc(req.params.uid).update({
      status,
      reviewedAt: new Date().toISOString(),
    })

    await db.collection("users").doc(req.params.uid).update({
      verified: status === "approved",
      verificationStatus: status,
    })

    res.json({ message: `Verification ${status} successfully` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

export default router