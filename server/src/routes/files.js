const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuid } = require("uuid");
const dayjs = require("dayjs");
const path = require("path");
const File = require("../models/File");
const optionalAuth = require("../middleware/optionalAuth");
const fs = require("fs");
const nodemailer = require("nodemailer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// @route   POST /files/upload
// @desc    Upload a file (auth is optional)
router.post("/upload", optionalAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required." });
  }
  const { sender_email, receiver_email } = req.body;
  const fileId = uuid();
  const expiry = dayjs().add(process.env.LINK_EXPIRY_HOURS, "hour").toDate();

  const newFile = await File.create({
    uuid: fileId,
    filename: req.file.originalname,
    stored_path: req.file.path,
    size: req.file.size,
    mime_type: req.file.mimetype,
    expiry_time: expiry,
    sender_email,
    receiver_email,
    created_by: req.user ? req.user.id : null, // Attach user ID if logged in
  });

  res.json({ downloadUrl: `${process.env.BASE_URL}/files/${fileId}` });
});

// @route   GET /files/:id/meta
// @desc    Get file metadata
router.get("/:id/meta", async (req, res) => {
  const file = await File.findOne({ uuid: req.params.id });
  if (!file) return res.status(404).json({ error: "File not found" });
  const left = dayjs(file.expiry_time).diff(dayjs());
  res.json({
    filename: file.filename,
    size: file.size,
    expiresIn: left,
    downloads: file.download_count,
  });
});

module.exports = router;
