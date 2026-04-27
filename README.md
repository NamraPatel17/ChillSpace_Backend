# ⚙️ ChillSpace — Backend API

<div align="center">

[![Frontend](https://img.shields.io/badge/🌐_Frontend-chillspace--frontend.vercel.app-6366f1?style=for-the-badge)](https://chillspace-frontend.vercel.app)
[![API Live](https://img.shields.io/badge/⚙️_API_Live-chillspace--backend.onrender.com-22c55e?style=for-the-badge)](https://chillspace-backend.onrender.com)

</div>

---

## 🔗 Live Links

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | [https://chillspace-frontend.vercel.app](https://chillspace-frontend.vercel.app) |
| ⚙️ **Backend API** | [https://chillspace-backend.onrender.com](https://chillspace-backend.onrender.com) |

---

## 📌 About

REST API backend for **ChillSpace** — a vacation rental platform. Built with Node.js, Express and MongoDB.

---

## 🚀 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime |
| **Express.js v5** | Web Framework |
| **MongoDB + Mongoose** | Database |
| **JWT** | Authentication |
| **Bcrypt** | Password Hashing |
| **Cloudinary** | Image Storage |
| **Nodemailer** | Emails |
| **Razorpay** | Payments |
| **Multer** | File Uploads |

---

## 📡 API Reference

### Auth / Users — `/users`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/users/register` | Register new user | ❌ |
| POST | `/users/login` | Login & get JWT | ❌ |
| GET | `/users/profile` | Get own profile | ✅ |
| PUT | `/users/profile` | Update profile | ✅ |
| POST | `/users/forgot-password` | Send reset email | ❌ |
| POST | `/users/reset-password/:token` | Reset password | ❌ |

### Properties — `/properties`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/properties` | Get all properties | ❌ |
| GET | `/properties/:id` | Get single property | ❌ |
| POST | `/properties` | Create property | ✅ Host |
| PUT | `/properties/:id` | Update property | ✅ Host |
| DELETE | `/properties/:id` | Delete property | ✅ Host |

### Bookings — `/bookings`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/bookings` | Create booking | ✅ |
| GET | `/bookings` | All bookings | ✅ Admin |
| GET | `/bookings/guest` | Guest bookings | ✅ |
| PUT | `/bookings/:id/status` | Update status | ✅ Host |
| PUT | `/bookings/:id/cancel` | Cancel booking | ✅ |

### Reviews — `/reviews`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/reviews` | Add property review | ✅ Guest |
| GET | `/reviews/:propertyId` | Get property reviews | ❌ |
| POST | `/reviews/guest` | Rate a guest | ✅ Host |
| DELETE | `/reviews/:id` | Delete review | ✅ Admin |

### Host — `/hosts`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/hosts/analytics` | Dashboard stats | ✅ Host |
| GET | `/hosts/properties` | Host's listings | ✅ Host |
| GET | `/hosts/bookings` | Host's bookings | ✅ Host |
| GET | `/hosts/earnings` | Earnings breakdown | ✅ Host |
| GET | `/hosts/reviews` | Reviews for host | ✅ Host |

### Disputes — `/disputes`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/disputes` | Raise a dispute | ✅ |
| GET | `/disputes/admin` | All disputes | ✅ Admin |
| PUT | `/disputes/admin/:id` | Update dispute | ✅ Admin |

### Payments — `/payments` / `/razorpay`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/razorpay/order` | Create Razorpay order | ✅ |
| POST | `/razorpay/verify` | Verify payment | ✅ |

### Admin — `/admin`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/dashboard` | Platform stats | ✅ Admin |
| GET | `/admin/users` | All users | ✅ Admin |
| PUT | `/admin/users/:id` | Update user | ✅ Admin |
| DELETE | `/admin/users/:id` | Delete user | ✅ Admin |

---

## 🛠️ Local Setup

```bash
git clone https://github.com/YOUR_USERNAME/chillspace-backend.git
cd chillspace-backend
npm install
# Create .env file with variables above
npm run dev
```

Server runs on `http://localhost:3000`

---

## 🌍 Deployment

Hosted on **Render** (Free Tier)
- Build Command: `npm install`
- Start Command: `npm start`

> Free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30s.

---

## 👩‍💻 Developed By

**Namra Patel**

