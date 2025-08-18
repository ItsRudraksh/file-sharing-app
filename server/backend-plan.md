# File Sharing App Backend (Team Plan)

This is the **step-by-step backend implementation plan** for our File Sharing App (like WeTransfer).  
We will follow this exactly, divided among 3 team members. Each step is small and beginner-friendly.  
We are using **Node.js, Express, MongoDB (Mongoose), Passport + JWT** for authentication.  
Deployment target: **Render + MongoDB Atlas** with persistent disk.

---

## 👥 Team & Branch Setup

- **Person A (Lead) — `main`**
  - Repo setup, environment, server skeleton, deployment, merges PRs.

- **Person B — `branch-b`**
  - Auth (signup/login), User model, JWT middleware.

- **Person C — `branch-c`**
  - File uploads/downloads, expiry cleanup, email sending.

**Git Workflow:**
```bash
# clone repo (everyone)
git clone <repo-url>
cd file-sharing-app/server

# Person B makes branch
git checkout -b branch-b

# Person C makes branch
git checkout -b branch-c

# Push your branch
git push origin branch-b
git push origin branch-c
```

Everyone works only on their branch → open PR → Person A merges to `main`.

---

## Phase 0 — Repo Initialization (Person A)

1. Create GitHub repo: `file-sharing-app`  
2. Clone locally and setup folders:

```bash
mkdir file-sharing-app
cd file-sharing-app/server
npm init -y
mkdir src src/routes src/controllers src/models src/middleware src/utils uploads
```

3. Add `.gitignore`:
```
node_modules
.env
uploads
```

4. Add `.env.example`:
```
PORT=5000
MONGO_URI=
JWT_SECRET=
BASE_URL=http://localhost:5000
LINK_EXPIRY_HOURS=24
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
UPLOAD_DIR=./uploads
ADMIN_TOKEN=
```

5. Push initial commit to `main`.

---

## Phase 1 — Base Server (Person A)

```bash
npm install express dotenv cors morgan helmet uuid multer jsonwebtoken passport passport-jwt mongoose nodemailer dayjs bcryptjs express-rate-limit node-cron
npm install --save-dev nodemon
```

Add `src/server.js`:

```js
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

app.get("/health", (req,res)=>{
  res.json({ok:true})
})

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log("MongoDB error",err))

app.listen(process.env.PORT, ()=>{
  console.log("Server running on port", process.env.PORT)
})
```

Add `package.json` scripts:
```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

Test:
```bash
npm run dev
# visit http://localhost:5000/health
```

---

## Phase 2 — Models

### Person B: User Model (`branch-b`)
`src/models/User.js`:
```js
const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("User", userSchema)
```

Commit + push → PR → Person A merges.

### Person C: File Model (`branch-c`)
`src/models/File.js`:
```js
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
```

Commit + push → PR → Person A merges.

---

## Phase 3 — Auth (Person B)

1. Install bcrypt (already installed).  
2. Create routes in `src/routes/auth.js`:

```js
const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

router.post("/signup", async (req,res)=>{
  const { email, password } = req.body
  const hash = await bcrypt.hash(password, 10)
  const user = new User({ email, passwordHash: hash })
  await user.save()
  res.json({ message: "User created" })
})

router.post("/login", async (req,res)=>{
  const { email, password } = req.body
  const user = await User.findOne({ email })
  if(!user) return res.status(401).json({error:"Invalid"})
  const match = await bcrypt.compare(password, user.passwordHash)
  if(!match) return res.status(401).json({error:"Invalid"})
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" })
  res.json({ token })
})

module.exports = router
```

3. Add middleware `src/middleware/auth.js`:

```js
const jwt = require("jsonwebtoken")

module.exports = function(req,res,next){
  const header = req.headers["authorization"]
  if(!header) return res.status(401).json({error:"No token"})
  const token = header.split(" ")[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch(err){
    res.status(401).json({error:"Invalid token"})
  }
}
```

4. Mount in `server.js`:
```js
const authRoutes = require("./routes/auth")
app.use("/auth", authRoutes)

const auth = require("./middleware/auth")
app.get("/me", auth, (req,res)=>{
  res.json({user:req.user})
})
```

---

## Phase 4 — File Upload (Person C)

1. Add multer config in `src/routes/files.js`:

```js
const express = require("express")
const router = express.Router()
const multer = require("multer")
const uuid = require("uuid").v4
const dayjs = require("dayjs")
const File = require("../models/File")
const path = require("path")

const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null, process.env.UPLOAD_DIR),
  filename: (req,file,cb)=>cb(null, Date.now() + "-" + file.originalname)
})

const upload = multer({ storage })

router.post("/upload", upload.single("file"), async (req,res)=>{
  const file = req.file
  const fileId = uuid()
  const expiry = dayjs().add(process.env.LINK_EXPIRY_HOURS, "hour").toDate()

  const newFile = await File.create({
    uuid: fileId,
    filename: file.originalname,
    stored_path: file.path,
    size: file.size,
    mime_type: file.mimetype,
    expiry_time: expiry,
    sender_email: req.body.sender_email,
    receiver_email: req.body.receiver_email,
    created_by: req.user ? req.user.id : null
  })

  res.json({ downloadUrl: `${process.env.BASE_URL}/files/${fileId}` })
})

module.exports = router
```

2. Add to `server.js`:
```js
const fileRoutes = require("./routes/files")
app.use("/files", fileRoutes)
```

---

## Phase 5 — Download & Metadata (Person C)

Add to `files.js`:

```js
const fs = require("fs")

router.get("/:id/meta", async (req,res)=>{
  const file = await File.findOne({ uuid: req.params.id })
  if(!file) return res.status(404).json({error:"Not found"})
  const now = new Date()
  const left = file.expiry_time - now
  res.json({ filename:file.filename, size:file.size, expiresIn:left, downloads:file.download_count })
})

router.get("/:id/download", async (req,res)=>{
  const file = await File.findOne({ uuid: req.params.id })
  if(!file) return res.status(404).json({error:"Not found"})
  if(file.expiry_time < new Date()) return res.status(410).json({error:"Expired"})
  file.download_count += 1
  await file.save()
  res.download(path.resolve(file.stored_path))
})
```

---

## Phase 6 — Email Sharing (Person C)

```js
const nodemailer = require("nodemailer")

router.post("/:id/send-email", async (req,res)=>{
  const file = await File.findOne({ uuid: req.params.id })
  if(!file) return res.status(404).json({error:"Not found"})

  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  })

  await transporter.sendMail({
    from: req.body.sender_email || "noreply@example.com",
    to: req.body.receiver_email || file.receiver_email,
    subject: "File Download Link",
    text: `Download here: ${process.env.BASE_URL}/files/${file.uuid}`
  })

  res.json({sent:true})
})
```

---

## Phase 7 — Expiry Cleanup (Person C)

`src/utils/cleanup.js`:

```js
const fs = require("fs")
const File = require("../models/File")

async function cleanup(){
  const now = new Date()
  const expired = await File.find({ expiry_time: { $lt: now } })
  for(let file of expired){
    try { fs.unlinkSync(file.stored_path) } catch(err){}
    await File.deleteOne({_id:file._id})
  }
  console.log("Cleanup done:", expired.length, "files removed")
}

module.exports = cleanup
```

In `server.js`:

```js
const cleanup = require("./utils/cleanup")
const cron = require("node-cron")

cron.schedule("*/10 * * * *", ()=>{
  cleanup()
})

app.delete("/admin/cleanup", (req,res)=>{
  if(req.headers["x-admin-token"] !== process.env.ADMIN_TOKEN){
    return res.status(401).json({error:"Unauthorized"})
  }
  cleanup()
  res.json({message:"Cleanup triggered"})
})
```

---

## Phase 8 — Safety (Person A)

In `server.js`:

```js
const rateLimit = require("express-rate-limit")

const authLimiter = rateLimit({ windowMs: 60*1000, max: 5 })
const uploadLimiter = rateLimit({ windowMs: 60*60*1000, max: 10 })

app.use("/auth", authLimiter)
app.use("/files/upload", uploadLimiter)
```

---

## Phase 9 — Docs & Deployment

### Person A
1. Update README with env variables + API endpoints.  
2. Create MongoDB Atlas DB, copy URI → `.env`.  
3. Deploy on Render:  
   - Add new Web Service → connect GitHub repo.  
   - Add persistent disk mounted at `/opt/uploads`.  
   - Set `UPLOAD_DIR=/opt/uploads`.  
   - Set env vars (MONGO_URI, JWT_SECRET, EMAIL creds, ADMIN_TOKEN, etc).  
   - Deploy.  

---

## Phase 10 — Final Test Checklist

- [ ] `/health` works  
- [ ] Signup/Login → get JWT  
- [ ] Upload file → get link  
- [ ] Meta shows expiry + count  
- [ ] Download works + increments count  
- [ ] Email sends link to inbox  
- [ ] Expiry cleanup deletes old files  
- [ ] Admin cleanup works  
- [ ] Rate limit blocks spam  

---

## ✅ Done!

Each teammate follows their exact branch plan, commits, and PRs.  
By the end, `main` will have a complete backend ready for deployment.

