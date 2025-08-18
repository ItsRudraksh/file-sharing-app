const fs = require("fs");
const File = require("../models/File");

async function cleanup() {
  const now = new Date();
  const expired = await File.find({ expiry_time: { $lt: now } });
  for (let file of expired) {
    try {
      if (fs.existsSync(file.stored_path)) {
        fs.unlinkSync(file.stored_path);
      }
    } catch (err) {
      console.error(`Failed to delete file: ${file.stored_path}`, err);
    }
    await File.deleteOne({ _id: file._id });
  }
  console.log("Cleanup done:", expired.length, "files removed");
}

module.exports = cleanup;
