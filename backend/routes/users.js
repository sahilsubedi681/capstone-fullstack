import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { db } from "../config/firebase.js"

const router = express.Router()

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.user.uid).get()

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(doc.data())
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Update user profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    await db.collection("users").doc(req.user.uid).update(req.body)

    res.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

// Get all users
router.get("/all", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get()

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
})

export default router