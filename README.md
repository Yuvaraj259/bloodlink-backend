# 🩸 BloodLink — Blood Donation Registry Portal

> Built for **CodeFiesta 6.0 Hackathon** — National Level 24 Hour Hackathon

A full-stack real-time blood donation registry portal connecting donors, patients, hospitals, and bootcamps.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite, Tailwind CSS, React Router |
| Real-time | Socket.io Client + Server |
| Maps | React Leaflet |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| SMS | Twilio |
| Certificates | PDFKit + Cloudinary |
| File Uploads | Multer + Cloudinary |
| Notifications | React Toastify |

---

## 🏗️ Project Structure

```
bloodlink/
├── frontend/          # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── auth/          # Login/Register pages
│       │   ├── user/          # User portal
│       │   ├── donor/         # Donor portal
│       │   ├── hospital/      # Hospital/Bootcamp portal
│       │   └── admin/         # Admin portal
│       ├── components/
│       │   └── Shared/        # DashboardLayout, Sidebar
│       ├── context/           # Auth + Socket contexts
│       └── utils/             # Axios API helper
│
└── backend/           # Node.js + Express backend
    ├── models/        # MongoDB models
    ├── routes/        # API routes
    ├── middleware/    # Auth middleware
    └── server.js      # Entry point + Socket.io
```

---

## ⚙️ Setup Instructions

### 1. Clone the project
```bash
git clone <your-repo>
cd bloodlink
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔧 Environment Variables (backend/.env)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/bloodlink
JWT_SECRET=your_secret_key

# Cloudinary (for certificate storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Twilio (for SMS alerts)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

CLIENT_URL=http://localhost:5173
```

---

## 🌐 Free Service Setup

| Service | Free Tier | Link |
|---------|-----------|------|
| MongoDB Atlas | 512MB free | https://cloud.mongodb.com |
| Cloudinary | 25GB free | https://cloudinary.com |
| Twilio | $15 trial credit | https://twilio.com |
| Render (backend) | Free tier | https://render.com |
| Vercel (frontend) | Free tier | https://vercel.com |

---

## 👤 Creating First Admin

Use MongoDB Atlas or a seed script:
```js
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Admin",
  email: "admin@bloodlink.com",
  password: "<bcrypt-hashed-password>",
  phone: "9999999999",
  role: "admin",
  createdAt: new Date()
})
```

Or run this once in backend:
```bash
node -e "
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  await User.create({ name:'Admin', email:'admin@bloodlink.com', password:'admin123', phone:'9999999999', role:'admin' });
  console.log('Admin created'); process.exit();
});
"
```

---

## 🎯 Features

### User Portal
- ✅ Register/Login
- ✅ Search donors by blood type + city (10km radius)
- ✅ **Privacy flow**: View Details + Contact buttons
- ✅ Send emergency blood requests (SMS + real-time)
- ✅ Track request status (pending/accepted/fulfilled)
- ✅ Approve donation → donor hidden 3 months
- ✅ Emergency hospital dashboard (call directly)

### Donor Portal
- ✅ Register/Login (pending admin approval)
- ✅ Real-time blood request alerts (YES/NO buttons)
- ✅ Accept → share live GPS location
- ✅ Decline → user notified automatically
- ✅ Donation history
- ✅ Download digital certificates

### Hospital / Bootcamp Portal
- ✅ Register (pending admin approval)
- ✅ Register donors directly
- ✅ View all registered donors
- ✅ Generate PDF certificates (via PDFKit)
- ✅ Upload existing certificates (via Cloudinary)

### Admin Portal
- ✅ Dashboard with system-wide stats
- ✅ Approve/Reject donors
- ✅ Approve/Reject hospitals & bootcamps
- ✅ View all blood requests
- ✅ User management

---

## 📡 API Endpoints

```
POST /api/auth/user/register       User registration
POST /api/auth/user/login          User login
POST /api/auth/donor/register      Donor registration
POST /api/auth/donor/login         Donor login
POST /api/auth/hospital/register   Hospital registration
POST /api/auth/hospital/login      Hospital login
POST /api/auth/admin/login         Admin login

GET  /api/donors/search            Search donors (public)
GET  /api/donors/:id/details       Get donor details
GET  /api/donors/:id/contact       Get donor contact info
PUT  /api/donors/profile           Update donor profile
POST /api/donors/register-by-entity Register donor by hospital

GET  /api/hospitals                List all approved hospitals
GET  /api/hospitals/my-donors      Hospital's donors

POST /api/requests                 Send blood request
POST /api/requests/:id/accept      Donor accepts request
POST /api/requests/:id/decline     Donor declines
POST /api/requests/:id/fulfill     Mark donation received

POST /api/certificates/generate/:id Generate PDF cert
POST /api/certificates/upload/:id  Upload cert
GET  /api/certificates/my          Donor's certificates

GET  /api/admin/stats              System stats
GET  /api/admin/donors             All donors (admin)
PUT  /api/admin/donors/:id/approve Approve donor
GET  /api/admin/hospitals          All hospitals
PUT  /api/admin/hospitals/:id/approve Approve hospital
```

---

## 🔌 Real-time Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client→Server | Register user socket |
| `blood_request` | Server→Donor | New blood request |
| `donor_accepted` | Server→All | Donor accepted request |
| `request_fulfilled_notify` | Server→Donors | Request fulfilled |

---

## 📱 Responsive Design

- Mobile-first design
- Collapsible sidebar on mobile
- Touch-friendly UI
- Works on all screen sizes

---

*Built with ❤️ for CodeFiesta 6.0 — Smt. Kamala & Sri Venkappa M. Agadi College of Engineering*
