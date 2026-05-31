import express from "express"
import cors from "cors"
import "./config/firebase.js"
import userRoutes from "./routes/users.js"
import listingsRoutes from "./routes/listings.js"

const app = express()

// Allow frontend origins
app.use(cors())

app.use(express.json())

// Home route
app.get("/", (req, res) => {
  res.send("Backend server is running")
})

app.use("/users", userRoutes)
app.use("/listings", listingsRoutes)

const PORT = process.env.PORT || 8000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})