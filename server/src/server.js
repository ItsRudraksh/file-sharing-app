const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const helmet = require("helmet")
const dotenv = require("dotenv")
const mongoose = require("mongoose")

dotenv.config()

const app = express()
app.use(cors())
app.use(morgan("dev"))
app.use(helmet())
app.use(express.json())

app.get("/health", (req, res) => {
  res.json({ ok: true })
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error", err))

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT)
})