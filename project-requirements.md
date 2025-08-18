# Project Requirements — File Sharing App (Like WeTransfer)

This document outlines the **official project requirements** based on the provided PDF.

---

## 📌 Project Title
**File Sharing App (Like WeTransfer)**

---

## 📖 Overview
- Users can upload **large files** (PDFs, ZIPs, images, etc.).  
- Instantly receive a **unique download link** for each file.  
- Optionally, send the link via **email** to someone.  
- Each upload link is **temporary** — it expires automatically after a set time (e.g., 24 hours).  
- Files are removed after expiration (auto-cleanup).  
- Goal: Simple, secure, effective, and user-friendly.  
- Full-stack app with upload/download, secure file handling, and optional login for advanced features.

---

## 🛠 Tech Stack

### Backend
- **Node.js + Express.js** — API logic and file uploads  
- **Multer** — file storage on server  
- **UUID** — generate unique download links  
- **Nodemailer** — email sending  
- **Moment.js** (or native Date libs) — expiry calculation  
- **Passport.js** with **JWT** or **session** login (optional authentication)  

### Database (Choose One)
- **MongoDB + Mongoose** (flexible schema)  
- **PostgreSQL + Prisma/Sequelize** (structured tables)  

Stores metadata such as:
- File name  
- Path  
- Upload time  
- Expiry time  
- Sender’s email  
- Receiver’s email  
- Download count  
- (Optional) created_by (user id if authenticated)  

### Frontend (React.js)
- Build clean, modern UI  
- Screens:
  - **Upload Page**: select file, enter email (optional), get shareable link  
  - **Success Page**: show link, copy/share options  
  - **Download Page**: download button with expiry info  
  - **Login Page (optional)**: track uploaded/downloaded files  
- Use Axios/Fetch to interact with Express API  
- Show expiry countdown dynamically  

---

## ⭐ Key Features

### 1. Easy Uploads
- Upload file via React frontend  
- Optionally enter sender/receiver email  
- File stored with Multer  
- Metadata saved in DB  

### 2. Shareable Download Links
- Unique UUID-based link generated after upload  
- Share via **copy link** or **send via email**  

### 3. Expiry & Auto-Cleanup
- Each file has expiry time (e.g., 24 hours)  
- Backend deletes expired files automatically  
- Frontend shows countdown (e.g., “expires in 5 hrs”)  

### 4. Track Downloads
- Record number of downloads  
- Optionally log: timestamp, IP, user id (if logged in)  

### 5. Security & Clean UX
- Files stored securely  
- Expired files removed  
- UUID links = hard to guess  
- Authenticated users can view/manage uploads  

---

## 🗄 Database Schema (Example)

### **files** (or `file_uploads`)
- id (UUID)  
- filename  
- file_path  
- upload_time  
- expiry_time  
- sender_email (optional)  
- receiver_email (optional)  
- download_count  
- created_by (if using auth)  

### **download_logs** (optional)
- file_id  
- timestamp  
- ip_address  
- user_id (if logged in)  

---

## ✅ End Goal
A **secure, full-stack file sharing app** with:  
- Simple upload & download flow  
- Temporary, unguessable links  
- Automatic expiry cleanup  
- Email sharing  
- Download tracking  
- Optional authentication for advanced features  

Essentially, a **mini WeTransfer clone**.  
