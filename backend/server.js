import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import "./config/firebase.js"
import userRoutes from "./routes/users.js"
import listingRoutes from "./routes/listings.js"

const app = express()
app.use(cors())

app.use((req, res, next) => {
  if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
    return next() // skip — multer in users.js handles this
  }
  express.json()(req, res, next)
})

app.get("/", (req, res) => {
  res.send("Backend server is running")
})

app.use("/users", userRoutes)
app.use("/listings", listingRoutes)

const PORT = process.env.PORT || 8000

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})