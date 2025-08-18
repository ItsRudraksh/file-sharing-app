const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const helmet = require("helmet")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const passport = require("passport")

dotenv.config()

const app = express()
app.use(cors())
app.use(morgan("dev"))
app.use(helmet())
app.use(express.json())
app.use(passport.initialize());
require("./config/passport")(passport);

app.get("/health", (req, res) => {
  res.json({ ok: true })
})
// Mount Auth Routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Add Protected Route for testing
const auth = require("./middleware/auth");
app.get("/me", auth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error", err))

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT)
})