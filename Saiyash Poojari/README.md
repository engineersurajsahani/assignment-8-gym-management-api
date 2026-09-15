# 🏋️‍♂️ Gym & Fitness Club Management REST API

Track: Backend Development | Level: Beginner to Intermediate  
Tech Stack: Node.js, Express.js, MongoDB, Mongoose, Passport.js (Local Strategy), Express-Session, Bcryptjs, dotenv, CORS

---

## 📌 1. Objective & Overview

A complete backend REST API for a Gym & Fitness Center Management System built with Node.js, Express, MongoDB, and Mongoose. Key features include:
- **Membership Lifecycle Management**: Registration with duration-based expiry calculation (`membershipExpiryDate`), remaining days calculation, membership renewals, and expired member queries.
- **Class Booking & Capacity Constraints**: Workout class scheduling, capacity limits (`maxCapacity`), duplicate booking prevention, and active membership validation.
- **Authentication**: Stateful session-based authentication using Passport.js Local Strategy and Bcrypt password hashing.

---

## 🏗️ 2. Project Architecture

```
assignment-08-gym-api/
├── config/
│   ├── db.js                # Mongoose database connection
│   └── passport.js          # Passport Local strategy setup
├── controllers/
│   ├── authController.js    # Register with auto-expiry calculation & session handlers
│   ├── classController.js   # Class CRUD & booking capacity logic
│   └── memberController.js  # Renewal & expired query handlers
├── middleware/
│   ├── authMiddleware.js    # Session authentication protection (ensureAuthenticated)
│   └── checkActiveMember.js # Active & non-expired membership validation
├── models/
│   ├── FitnessClass.js      # Fitness Class Mongoose Schema
│   └── User.js              # User/Member Mongoose Schema with bcrypt hooks
├── routes/
│   ├── authRoutes.js        # Authentication endpoints
│   ├── classRoutes.js       # Class & Booking endpoints
│   └── memberRoutes.js      # Membership management endpoints
├── .env.example
├── .env
├── .gitignore
├── package.json
├── server.js                # Application entry point
├── postman_collection.json  # Pre-configured Postman Collection (v2.1.0)
└── README.md
```

---

## 🛠️ 3. Setup & Installation

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB server running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/gym_management
SESSION_SECRET=gym_super_secret_key_2026
```

### 3. Run Application
- **Development Mode (Nodemon)**:
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
- **Automated Test Suite**:
  ```bash
  npm test
  ```

---

## 📋 4. API Endpoints Specification

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new member with chosen membership plan | `{"username":"fit_sam","email":"sam@fit.com","password":"mypassword","membershipTier":"Gold","durationMonths":3}` | `201 Created`, `400 Bad Request` |
| `POST` | `/api/auth/login` | Login via Passport Local Strategy | `{"username":"fit_sam","password":"mypassword"}` | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/auth/me` | Fetch active member profile & remaining days | None | `200 OK`, `401 Unauthorized` |
| `POST` | `/api/auth/logout` | Terminate active user session | None | `200 OK` |

---

### 🏋️‍♂️ Fitness Class & Booking (`/api/classes`)

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/classes` | Fetch all upcoming classes (supports `?trainer=Maria`) | None | `200 OK` |
| `GET` | `/api/classes/:id` | Get class details with enrolled members list | None | `200 OK`, `404 Not Found` |
| `POST` | `/api/classes` | Create a new workout class | `{"title":"Zumba Cardio","trainerName":"Maria","scheduleDate":"2026-04-15T09:00:00Z","maxCapacity":20}` | `201 Created`, `400 Bad Request` |
| `POST` | `/api/classes/:id/book` | Enroll logged-in user (Fails if full or expired) | None | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| `DELETE` | `/api/classes/:id/cancel` | Cancel member booking from class | None | `200 OK`, `400 Bad Request`, `401 Unauthorized` |

---

### 💳 Membership Management (`/api/members`)

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/members/:id/renew` | Renew / extend membership expiry date & tier | `{"additionalMonths": 6, "tier": "Platinum"}` | `200 OK`, `404 Not Found` |
| `GET` | `/api/members/expired` | Get list of all expired memberships | None | `200 OK` |

---

## 🧪 5. Postman Collection

Import `postman_collection.json` directly into Postman. It contains pre-configured requests with environment variables for all API endpoints.
