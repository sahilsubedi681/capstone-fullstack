import admin from "firebase-admin"
import { db } from "../config/firebase.js"

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1]

  if (!token) {
    return res.status(401).json({ error: "No token provided" })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" })
  }
}

export const requireAdmin = async (req, res, next) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get()
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" })
    }
    next()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Server error" })
  }
}