# Gym & Fitness Club Management API

A production-ready RESTful API built with **Node.js**, **Express.js**, **MongoDB**, **Mongoose**, **Passport.js (passport-local)**, and **express-session** for managing gym memberships, class schedules, and automated enrollments.

---

## Features

- **Authentication & Sessions**: Cookie-based session authentication with Passport.js and bcrypt password hashing.
- **Accurate Expiry Math**: Intelligent month arithmetic handling month-end roll-overs (e.g., Jan 31 + 1 month rolls over safely to Feb 28/29).
- **Class Booking Engine**: Real-time capacity enforcement, duplicate enrollment prevention, and membership active status validation.
- **Membership Lifecycle & Self-Healing**: Dynamic remaining-days calculation, non-stacking renewals from the later of current expiry or now, and self-healing expired member status checks.
- **Populated Relational Queries**: Filter upcoming fitness classes with populated attendee information and search by trainer name.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js (`passport-local`), `express-session`, `bcryptjs`
- **Utilities**: `dotenv`, `cors`, `nodemon`

---

## Folder Structure

```
assignment-08-gym-api/
├── config/
│   ├── db.js
│   └── passport.js
├── controllers/
│   ├── authController.js
│   ├── classController.js
│   └── memberController.js
├── middleware/
│   ├── authMiddleware.js
│   └── checkActiveMember.js
├── models/
│   ├── FitnessClass.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── classRoutes.js
│   └── memberRoutes.js
├── .env.example
├── .gitignore
├── package.json
├── postman_collection.json
├── server.js
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB running locally (default: `mongodb://localhost:27017/gym-fitness-api`) or MongoDB Atlas URI

### Installation & Setup

1. **Clone or navigate into the repository**:
   ```bash
   cd assignment-08-gym-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and customize your values:
   ```bash
   cp .env.example .env
   ```
   Default `.env` configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/gym-fitness-api
   SESSION_SECRET=gym_fitness_secret_key_2026_super_secure
   PORT=5000
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Start Production Server**:
   ```bash
   npm start
   ```

---

## API Endpoints Reference

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Sample Request Body |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Register a new member with durationMonths | No | `{"username": "johndoe", "email": "john@example.com", "password": "password123", "membershipTier": "Gold", "durationMonths": 3, "emergencyContact": "+1-555-0199"}` |
| `POST` | `/api/auth/login` | Login with username and password | No | `{"username": "johndoe", "password": "password123"}` |
| `POST` | `/api/auth/logout` | Destroy current user session | Yes | *None* |
| `GET` | `/api/auth/me` | Fetch logged-in profile & computed `remainingDays` | Yes | *None* |

### 2. Classes (`/api/classes`)

| Method | Endpoint | Description | Auth Required | Sample Request Body / Query |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/classes` | Create a new fitness class | No / Yes | `{"title": "Morning HIIT", "trainerName": "Sarah Connor", "scheduleDate": "2026-10-15T09:00:00.000Z", "durationMinutes": 45, "maxCapacity": 2}` |
| `GET` | `/api/classes` | List upcoming classes (filter by trainer) | No | `?trainer=Sarah` |
| `GET` | `/api/classes/:id` | Get class details with enrolled members populated | No | *None* |
| `POST` | `/api/classes/:id/book` | Book a spot in class (checks capacity & active membership) | Yes | *None* |
| `DELETE`| `/api/classes/:id/cancel` | Cancel booking for the authenticated user | Yes | *None* |

### 3. Members (`/api/members`)

| Method | Endpoint | Description | Auth Required | Sample Request Body |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/members` | Get all members (optional query: `?tier=Gold&status=active`) | No | *None* |
| `GET` | `/api/members/expired` | List all expired members and self-heal `membershipStatus` to 'expired' | No | *None* |
| `PATCH`| `/api/members/:id/renew` | Renew membership (extends from later of `now` or `currentExpiry`) | No / Yes | `{"additionalMonths": 6, "membershipTier": "Platinum"}` |

---

## Testing & Verification Guide

### 1. Verification of 1-Month Registration Date Math
1. Send `POST /api/auth/register` with `durationMonths: 1`.
2. Inspect the returned `membershipExpiryDate`:
   - If registered on `2026-09-08`, the expiry date is computed as `2026-10-08`.
   - On month-end edges (e.g. Jan 31), it properly rolls over to the end of Feb (Feb 28 / 29) without spilling over into March.

### 2. Verification of Class Capacity Enforcement (`maxCapacity = 2`)
1. Create a class with `maxCapacity: 2` via `POST /api/classes`.
2. Register and log in with Member A, then call `POST /api/classes/:id/book` $\rightarrow$ **200 OK** (1/2 filled).
3. Register and log in with Member B, then call `POST /api/classes/:id/book` $\rightarrow$ **200 OK** (2/2 filled).
4. Register and log in with Member C, then call `POST /api/classes/:id/book` $\rightarrow$ **400 Bad Request** with message `"Class capacity reached"`.
5. Member A calls `POST /api/classes/:id/book` again $\rightarrow$ **400 Bad Request** with message `"User is already enrolled in this class"`.

### 3. Verification of Self-Healing Expired Members Query
1. Create or set a user whose `membershipExpiryDate` is in the past and `membershipStatus` is `'active'`.
2. Call `GET /api/members/expired`.
3. Verify that the response includes this user and that their `membershipStatus` in the database has automatically been self-healed to `'expired'`.
4. If this user attempts to call `POST /api/classes/:id/book`, it fails with **400 Bad Request** (`"Membership expired"`).
5. Call `PATCH /api/members/:id/renew` with `{"additionalMonths": 3}` $\rightarrow$ Expiry date is extended from `now` and status resets to `'active'`.

---

## Postman Collection

Import `postman_collection.json` into Postman to test all endpoints out-of-the-box with preconfigured environment variables and cookie-jar session handling.
