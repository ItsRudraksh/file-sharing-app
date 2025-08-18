const mongoose = require("mongoose")

const fileSchema = new mongoose.Schema({
  uuid: { type: String, required: true },
  filename: String,
  stored_path: String,
  size: Number,
  mime_type: String,
  upload_time: { type: Date, default: Date.now },
  expiry_time: Date,
  sender_email: String,
  receiver_email: String,
  download_count: { type: Number, default: 0 },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
})

module.exports = mongoose.model("File", fileSchema)