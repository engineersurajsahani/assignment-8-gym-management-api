# 🏋️‍♂️ Gym & Fitness Club Management REST API

> 🌐 **Live Deployed API URL**: https://assignment-8-gym-management-api-2ox9.onrender.com

A full-featured, production-ready backend REST API for a **Gym & Fitness Club Management System** built with **Node.js**, **Express.js**, **MongoDB/Mongoose**, **Passport.js (Local Strategy)**, and **Express-Session**.

---

## 🌐 Live Deployment
- **Base URL**: https://assignment-8-gym-management-api-2ox9.onrender.com
- **Health Check**: https://assignment-8-gym-management-api-2ox9.onrender.com/

---

## 🚀 Features

- **🔐 Stateful Session Authentication**:
  - Secure registration and login using **Passport.js Local Strategy**.
  - Password hashing with **bcryptjs** (salt factor 10) in Mongoose pre-save hooks.
  - Active session handling via `express-session` cookies.
  - `/api/auth/me` endpoint calculating dynamically computed remaining membership days.

- **📅 Membership Lifecycle & Automatic Date Computations**:
  - Auto-calculates `membershipExpiryDate` exactly **30 days per month** upon registration.
  - Multi-tier membership support (`Bronze`, `Silver`, `Gold`, `Platinum`).
  - Active status enforcement and expired membership tracking.
  - Subscription renewal endpoint `/api/members/:id/renew` supporting extension and tier upgrade.
  - Query handler `/api/members/expired` to list all members whose subscription has expired.

- **🏋️ Fitness Classes & Smart Capacity Controls**:
  - Create and manage workout classes with schedule dates and durations.
  - Filter classes by trainer name (`?trainer=Maria`) or class title.
  - Dynamic seat capacity validation to prevent over-enrollment.
  - Automatic seat booking and cancellation with member population.

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
- **Authentication**: [Passport.js](https://www.passportjs.org/) (`passport-local`) & [Express-Session](https://github.com/expressjs/session)
- **Security**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Testing**: Jest, Supertest & MongoMemoryServer

---

## 📁 Project Structure

```text
assignment-08-gym-api/
├── config/
│   ├── db.js                # Mongoose connection logic
│   └── passport.js          # Passport Local strategy setup
├── controllers/
│   ├── authController.js    # Register with auto-expiry calculation, login, me, logout
│   ├── classController.js   # Class CRUD & booking capacity logic
│   └── memberController.js  # Renewal & expired query handlers
├── middleware/
│   ├── authMiddleware.js    # Ensure session authentication
│   └── checkActiveMember.js # Check member is not expired
├── models/
│   ├── FitnessClass.js      # Fitness class Mongoose schema & virtuals
│   └── User.js              # User schema, bcrypt hooks, and helper methods
├── routes/
│   ├── authRoutes.js        # /api/auth routes
│   ├── classRoutes.js       # /api/classes routes
│   └── memberRoutes.js      # /api/members routes
├── test/
│   └── api.test.js          # Automated end-to-end test suite
├── .env.example             # Sample environment variables
├── .gitignore
├── package.json
├── postman_collection.json  # Postman test suite
├── server.js                # App entry point
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (>= 18.x)
- MongoDB installed locally OR a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string.

### 2. Installation
```bash
git clone https://github.com/your-username/assignment-08-gym-api.git
cd assignment-08-gym-api
npm install
```

### 3. Environment Setup
Copy the example `.env` file and configure your values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gym_management_db
SESSION_SECRET=your_super_secret_session_key
```

### 4. Running the Server
- **Development mode (with auto-reload)**:
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```
- Server will start at `http://localhost:5000`.

---

## 🧪 Running Automated Tests

Run the automated test suite powered by `jest` and `mongodb-memory-server`:
```bash
npm test
```

---

## 📋 API Endpoints Specification

### 🔐 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new member with chosen membership plan | `{"username":"fit_sam","email":"sam@fit.com","password":"mypassword","membershipTier":"Gold","durationMonths":3}` | `201 Created`<br>`400 Bad Request` |
| `POST` | `/api/auth/login` | Login via Passport Local | `{"username":"fit_sam","password":"mypassword"}` | `200 OK`<br>`401 Unauthorized` |
| `GET` | `/api/auth/me` | Fetch active member profile & remaining days | *None* (Session cookie) | `200 OK`<br>`401 Unauthorized` |
| `POST` | `/api/auth/logout` | Logout active member session | *None* | `200 OK` |

---

### 🏋️‍♂️ 2. Fitness Classes & Bookings (`/api/classes`)

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/classes` | Fetch all upcoming classes (supports `?trainer=John`) | *None* | `200 OK` |
| `GET` | `/api/classes/:id` | Get class details with enrolled members | *None* | `200 OK`<br>`404 Not Found` |
| `POST` | `/api/classes` | Create a new workout class | `{"title":"Zumba Cardio","trainerName":"Maria","scheduleDate":"2026-04-15T09:00:00Z","durationMinutes":60,"maxCapacity":20}` | `201 Created`<br>`400 Bad Request` |
| `POST` | `/api/classes/:id/book` | Enroll logged-in user (Fails if class is full or user membership expired) | *None* | `200 OK`<br>`400 Class Full / Expired` |
| `DELETE` | `/api/classes/:id/cancel` | Cancel member booking from class | *None* | `200 OK`<br>`400 Not Enrolled` |

---

### 💳 3. Membership Management (`/api/members`)

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/members/:id/renew` | Renew / extend membership expiry date | `{"additionalMonths": 6, "tier": "Platinum"}` | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` |
| `GET` | `/api/members/expired` | Get list of all expired memberships | *None* | `200 OK` |

---

## 📮 Postman Collection

A complete Postman test collection is included in the project: [`postman_collection.json`](./postman_collection.json).

### How to use in Postman:
1. Open Postman.
2. Click **Import** > Select `postman_collection.json`.
3. Set the environment variable `baseUrl` to `http://localhost:5000`.
4. Run requests in sequence to test authentication, class bookings, capacity limits, and renewals!

---

## 🚀 Deployment Guide (Render / Railway / Atlas)

1. **MongoDB Atlas**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Get the connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/gym_db?retryWrites=true&w=majority`.

2. **Render.com / Railway**:
   - Create a new Web Service and link your GitHub repository.
   - Set the Build Command: `npm install`
   - Set the Start Command: `npm start`
   - Set Environment Variables:
     - `PORT`: `5000`
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: `<your_atlas_connection_string>`
     - `SESSION_SECRET`: `<your_random_secret_string>`

---

## 📄 License
ISC
