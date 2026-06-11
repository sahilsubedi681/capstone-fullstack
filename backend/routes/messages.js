import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { db } from "../config/firebase.js"

const router = express.Router()

function conversationId(uid1, uid2) {
  return [uid1, uid2].sort().join("_")
}

async function ensureConversation(userId1, userId2, meta = {}) {
  const convId = conversationId(userId1, userId2)
  const convRef = db.collection("conversations").doc(convId)
  const convSnap = await convRef.get()

  if (!convSnap.exists) {
    await convRef.set({
      participants: [userId1, userId2].sort(),
      listingId: meta.listingId || null,
      listingLabel: meta.listingLabel || null,
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
    })
  } else if (meta.listingId) {
    await convRef.update({
      listingId: meta.listingId,
      listingLabel: meta.listingLabel || null,
    })
  }

  return convId
}

router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection("conversations")
      .where("participants", "array-contains", req.user.uid)
      .get()

    const conversations = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt || b.createdAt).getTime() -
          new Date(a.lastMessageAt || a.createdAt).getTime()
      )

    res.json({ conversations })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load conversations" })
  }
})

router.get("/conversations/:convId/messages", verifyToken, async (req, res) => {
  try {
    const convRef = db.collection("conversations").doc(req.params.convId)
    const convSnap = await convRef.get()

    if (!convSnap.exists) {
      return res.status(404).json({ error: "Conversation not found" })
    }

    const participants = convSnap.data().participants || []
    if (!participants.includes(req.user.uid)) {
      return res.status(403).json({ error: "Not allowed to view this conversation" })
    }

    const snapshot = await convRef.collection("messages").get()
    const messages = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    res.json({ messages })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to load messages" })
  }
})

router.post("/send", verifyToken, async (req, res) => {
  try {
    const { recipientId, content, senderName, listingId, listingLabel } = req.body
    const senderId = req.user.uid

    if (!recipientId || !content?.trim()) {
      return res.status(400).json({ error: "Recipient and message content are required" })
    }

    if (recipientId === senderId) {
      return res.status(400).json({ error: "Cannot message yourself" })
    }

    const convId = await ensureConversation(senderId, recipientId, { listingId, listingLabel })
    const convRef = db.collection("conversations").doc(convId)
    const trimmedContent = content.trim()
    const now = new Date().toISOString()

    await convRef.update({
      lastMessage: trimmedContent,
      lastMessageAt: now,
      lastSenderId: senderId,
    })
    await convRef.collection("messages").add({
      conversationId: convId,
      senderId,
      senderName: senderName || "User",
      content: trimmedContent,
      isRead: false,
      createdAt: now,
    })

    res.status(201).json({ conversationId: convId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to send message" })
  }
})

router.post("/conversations/ensure", verifyToken, async (req, res) => {
  try {
    const { recipientId, listingId, listingLabel } = req.body

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient is required" })
    }

    const convId = await ensureConversation(req.user.uid, recipientId, { listingId, listingLabel })
    res.json({ conversationId: convId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to start conversation" })
  }
})

export default router
