const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const helmet = require("helmet")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const passport = require("passport")
const authRoutes = require("./routes/auth");
const fileRoutes = require("./routes/files");
const cleanup = require("./utils/cleanup");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");

dotenv.config()

const app = express()
app.use(cors())
app.use(morgan("dev"))
app.use(helmet())
app.use(express.json())
app.use(passport.initialize());
require("./config/passport")(passport);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts, please try again after 15 minutes" });
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: "Too many files uploaded, please try again after an hour" });

cron.schedule("*/10 * * * *", () => {
  console.log("Running scheduled cleanup...");
  cleanup();
});

app.get("/health", (req, res) => {
  res.json({ ok: true })
})

app.use("/auth", authRoutes);
app.use("/files", fileRoutes);

const auth = require("./middleware/auth");
app.get("/me", auth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

app.delete("/admin/cleanup", (req, res) => {
  if (req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  cleanup();
  res.json({ message: "Cleanup triggered" });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error", err))

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT)
})