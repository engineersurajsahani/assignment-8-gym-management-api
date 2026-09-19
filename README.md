# 🏋️‍♂️ Gym & Fitness Club Management REST API (Assignment 8)

🚀 **Live Deployment Links:**
- **Render:** [https://samarth-assignment-8-gym-management-api.onrender.com](https://samarth-assignment-8-gym-management-api.onrender.com)
- **Vercel:** [https://samarth-assignment-8-gym-management.vercel.app](https://samarth-assignment-8-gym-management.vercel.app)

---

- **Name:** Samarth Navale
- **Roll No:** 150096725148
- **Cohort:** Sam Altman

---

A RESTful API for **Gym & Fitness Center Management** built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, and **Passport.js (Local Strategy)**.

Features member lifecycle management with automated expiry calculation, membership renewals, fitness class scheduling, and capacity-constrained class booking.

---

## 🚀 Features

- 🔐 **Authentication & Session Management**: Secure registration and login using Passport.js Local Strategy with bcrypt password hashing and express-session.
- 🏋️‍♂️ **Fitness Classes & Capacity Bookings**:
  - Class creation with trainer details, schedule date, duration, and capacity limit.
  - Active members can book slots in classes with automatic capacity enforcement.
  - Booking cancellation support.
- 💳 **Membership Lifecycle Management**:
  - Auto-calculation of membership expiry dates based on plan duration.
  - Membership renewal endpoint (`PATCH /api/members/:id/renew`) extending expiry from existing active date or current date.
  - Expired membership lookup endpoint (`GET /api/members/expired`).
- 🛡️ **Active Member Authorization**: Custom middleware `checkActiveMember` ensuring expired/frozen members cannot book classes.
- 📊 **Swagger API Documentation**: OpenAPI 3.0 interactive docs at `/api-docs`.
- 📮 **Postman Collection**: Preconfigured collection in `docs/` folder.

---

## 📁 Project Folder Structure

```text
📂 Assignment8/
├── 📄 render.yaml
├── 📄 vercel.json
├── 📄 Assignment 8.txt
├── 📄 README.md
└── 📂 Samarth_Navale_150096725148/
    ├── 📄 server.js
    ├── 📄 package.json
    ├── 📄 .env & .env.example
    ├── 📄 .gitignore
    ├── 📄 render.yaml & vercel.json
    ├── 📄 README.md
    ├── 📂 config/
    │   ├── 📄 db.js
    │   ├── 📄 passport.js
    │   └── 📄 swagger.js
    ├── 📂 models/
    │   ├── 📄 User.js
    │   └── 📄 FitnessClass.js
    ├── 📂 middleware/
    │   ├── 📄 authMiddleware.js
    │   ├── 📄 checkActiveMember.js
    │   ├── 📄 logger.js
    │   └── 📄 errorHandler.js
    ├── 📂 controllers/
    │   ├── 📄 authController.js
    │   ├── 📄 classController.js
    │   └── 📄 memberController.js
    ├── 📂 routes/
    │   ├── 📄 authRoutes.js
    │   ├── 📄 classRoutes.js
    │   └── 📄 memberRoutes.js
    └── 📂 docs/
        ├── 📄 swagger.yaml
        └── 📄 Gym_Management_API.postman_collection.json
```

---

## ⚙️ Installation & Setup

```bash
cd Samarth_Navale_150096725148
npm install
cp .env.example .env
npm start
```

API Server: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/api-docs`

---

## 📋 API Endpoints Specification

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Request Body Example | Status |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new member | `{"username":"fit_sam","email":"sam@fit.com","password":"mypassword","membershipTier":"Gold","durationMonths":3}` | `201 Created`<br>`400 Bad Request` |
| `POST` | `/api/auth/login` | Login member | `{"username":"fit_sam","password":"mypassword"}` | `200 OK`<br>`401 Unauthorized` |
| `POST` | `/api/auth/logout` | Logout member | None | `200 OK` |
| `GET` | `/api/auth/me` | Current profile & days remaining | None | `200 OK`<br>`401 Unauthorized` |

### 🏋️‍♂️ Classes & Bookings (`/api/classes`)
| Method | Endpoint | Description | Request Body Example | Status |
|---|---|---|---|---|
| `GET` | `/api/classes` | Fetch upcoming classes (supports `?trainer=Maria`) | None | `200 OK` |
| `GET` | `/api/classes/:id` | Fetch class details & members | None | `200 OK`<br>`404 Not Found` |
| `POST` | `/api/classes` | Create new workout class | `{"title":"Zumba Cardio","trainerName":"Maria","scheduleDate":"2026-04-15T09:00:00Z","durationMinutes":60,"maxCapacity":20}` | `201 Created`<br>`400 Bad Request` |
| `POST` | `/api/classes/:id/book` | Enroll member in class | None | `200 OK`<br>`400 Capacity/Expired` |
| `DELETE` | `/api/classes/:id/cancel` | Cancel class booking | None | `200 OK`<br>`400 Not Enrolled` |

### 💳 Memberships (`/api/members`)
| Method | Endpoint | Description | Request Body Example | Status |
|---|---|---|---|---|
| `PATCH` | `/api/members/:id/renew` | Renew / extend expiry | `{"additionalMonths": 6, "tier": "Platinum"}` | `200 OK`<br>`404 Not Found` |
| `GET` | `/api/members/expired` | Get all expired members | None | `200 OK` |
