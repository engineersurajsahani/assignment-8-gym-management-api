# 🏋️‍♂️ Gym & Fitness Club Management REST API

> **Assignment 08:** Production-ready Gym & Fitness Club Management REST API  
> **Author:** Pari Gothi  
> **Tech Stack:** Node.js, Express.js, MongoDB (Mongoose), Passport.js (Local Strategy), Express-Session, bcryptjs  

---

## 📌 Project Overview

This backend REST API provides a complete management system for a gym & fitness club. It handles member authentication with Passport.js session auth, dynamic membership lifecycle management (automatic 30-day/month expiry calculations, renewals, and status synchronization), fitness class scheduling, capacity-constrained class booking, and member profile management.

---

## 🚀 Key Features

1. **Passport.js Local Strategy Authentication**:
   - Secure password hashing with `bcryptjs`.
   - Stateful session management via `express-session` cookies.
   - Protected routes guarded by `ensureAuthenticated` middleware.
2. **Membership Lifecycle & Auto-Expiry**:
   - Computes `membershipExpiryDate` upon registration (`startDate + durationMonths * 30 days`).
   - Mongoose pre-save hook synchronizes `membershipStatus` (`active` vs `expired`).
   - Renewal endpoint (`PATCH /api/members/:id/renew`) extends validity and reactivates expired plans.
   - Query endpoint (`GET /api/members/expired`) filters expired members.
3. **Fitness Class Capacity Enforcement**:
   - Prevents overbooking beyond `maxCapacity` with `400 Bad Request: Class capacity reached`.
   - Prevents inactive or expired members from booking workouts.
   - Enables booking cancellation and member de-enrollment.
   - Populates enrolled member details (`.populate('enrolledMembers')`).
   - Supports filtering classes by trainer name (`?trainer=John`).
4. **Member Profile & Dynamic Days Remaining**:
   - `GET /api/auth/me` computes real-time remaining days until expiration.

---

## 🛠️ Project Folder Structure

```text
Pari_Gothi/
├── config/
│   ├── db.js                # MongoDB Atlas connection handler
│   └── passport.js          # Passport Local strategy & session serialization
├── controllers/
│   ├── authController.js    # Register, login, profile (me), logout
│   ├── classController.js   # Class CRUD, capacity booking & cancellation
│   └── memberController.js  # Membership renewal & expired member query
├── middleware/
│   ├── authMiddleware.js    # Session authentication guard (req.isAuthenticated)
│   └── checkActiveMember.js # Active & unexpired membership validator
├── models/
│   ├── FitnessClass.js      # Fitness class Mongoose schema & relationships
│   └── User.js              # User/Member schema with hooks & date helpers
├── routes/
│   ├── authRoutes.js        # Auth endpoint routing
│   ├── classRoutes.js       # Class & booking routing
│   └── memberRoutes.js      # Member lifecycle routing
├── .env.example             # Template for environment variables
├── .gitignore               # Ignores node_modules and .env
├── package.json             # NPM scripts and dependencies
├── postman_collection.json  # Postman test collection
├── server.js                # Express app bootstrap & middleware mounting
└── README.md                # Documentation & deployment guide
```

---

## 📋 API Endpoints Specification

### 🔐 1. Authentication Endpoints

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register new member with plan | `{"username":"fit_sam","email":"sam@fit.com","password":"mypassword","membershipTier":"Gold","durationMonths":1}` | `201 Created`<br>`400 Bad Request` |
| `POST` | `/api/auth/login` | Login via Passport Local & set session cookie | `{"username":"fit_sam","password":"mypassword"}` | `200 OK`<br>`401 Unauthorized` |
| `GET` | `/api/auth/me` | Fetch active member profile & remaining days | None *(Session Cookie)* | `200 OK`<br>`401 Unauthorized` |
| `POST` | `/api/auth/logout` | Destroy session & logout | None *(Session Cookie)* | `200 OK` |

### 🏋️‍♂️ 2. Fitness Classes & Booking Endpoints

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/classes` | Fetch all classes (supports `?trainer=John`) | None | `200 OK` |
| `GET` | `/api/classes/:id` | Get class with populated enrolled members | None | `200 OK`<br>`404 Not Found` |
| `POST` | `/api/classes` | Create a new fitness class | `{"title":"HIIT Bootcamp","trainerName":"John","scheduleDate":"2026-05-01T10:00:00Z","maxCapacity":2}` | `201 Created`<br>`400 Bad Request` |
| `POST` | `/api/classes/:id/book` | Enroll logged-in member (fails if full / expired) | None *(Session Cookie)* | `200 OK`<br>`400 Class Full / Expired` |
| `DELETE` | `/api/classes/:id/cancel` | Cancel member booking from class | None *(Session Cookie)* | `200 OK`<br>`400 / 404` |

### 💳 3. Membership Management Endpoints

| Method | Endpoint | Description | Request Body Example | Status Codes |
|---|---|---|---|---|
| `PATCH` | `/api/members/:id/renew` | Renew / extend membership expiry date | `{"additionalMonths": 6, "tier": "Platinum"}` | `200 OK`<br>`404 Not Found` |
| `GET` | `/api/members/expired` | Get list of all expired memberships | None | `200 OK` |

---

## ⚙️ Local Setup Instructions

### 1. Install Dependencies
```bash
cd Pari_Gothi
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `Pari_Gothi/`:
```bash
cp .env.example .env
```
Populate `.env` with your values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/gymDB?retryWrites=true&w=majority
SESSION_SECRET=gym_super_secret_session_key_2026
```

### 3. Run the Development Server
```bash
npm run dev
# Or for production:
npm start
```

---

## 🗄️ Setting Up MongoDB Atlas

1. **Sign Up / Log In**: Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free M0 cluster.
2. **Create a Database User**:
   - Go to **Security** -> **Database Access** -> **Add New Database User**.
   - Choose **Password** authentication, create a username and password, and grant `Read and write to any database`.
3. **Configure IP Access**:
   - Go to **Security** -> **Network Access** -> **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so both local dev and Render instances can connect.
4. **Get Connection String**:
   - Go to **Database** -> **Deployments** -> Click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the URI string:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/gymDB?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.
   - Paste this into your `.env` file as `MONGO_URI`.

---

## ☁️ Deploying to Render

1. **Push your code to GitHub** (see instructions below).
2. Go to [Render Dashboard](https://render.com/) and click **New +** -> **Web Service**.
3. Connect your GitHub repository (`itm-assignment-08-gym-api`).
4. Configure the Web Service settings:
   - **Name**: `gym-management-api`
   - **Root Directory**: `Pari_Gothi` (or leave blank if repository root is the project)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. **Add Environment Variables**:
   Under the service's **Environment** tab, add:
   - `MONGO_URI` = `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/gymDB?retryWrites=true&w=majority`
   - `SESSION_SECRET` = `your_strong_random_secret_string`
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**.
7. **Verify Deployment**:
   - Check the build & runtime logs. You should see:
     ```text
     ✅ MongoDB Connected Successfully: cluster0-shard-00-00.xxxxx.mongodb.net
     🚀 Server running on port 10000 [Environment: production]
     ```
   - The public URL will be live at `https://<your-service-name>.onrender.com`.

> **Note on Cookies & Sessions behind Render HTTPS Proxy:**  
> The project configures `app.set('trust proxy', 1);` and sets `cookie: { secure: process.env.NODE_ENV === 'production' }` so that express-session cookies work seamlessly across HTTPS on Render.

---

## 🐙 Pushing to GitHub

Run the following commands from your terminal:

```bash
# 1. Initialize git (if not already done)
git init

# 2. Add files
git add .

# 3. Commit changes
git commit -m "feat: complete Gym & Fitness Club Management REST API (Assignment 08)"

# 4. Rename main branch
git branch -M main

# 5. Link to your GitHub repository
git remote add origin https://github.com/<your-username>/itm-assignment-08-gym-api.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🧪 Testing the API & Verification Workflow

### 1. Test Suite using Postman
Import `postman_collection.json` into Postman (`File` -> `Import` -> Select `postman_collection.json`).

### 2. Manual Verification Flow (using cURL)

#### Step 1: Register Member (1-Month Membership)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "fit_sam",
    "email": "sam@fit.com",
    "password": "mypassword123",
    "membershipTier": "Gold",
    "durationMonths": 1
  }'
```
*Verify: `membershipExpiryDate` is calculated exactly 30 days from registration date.*

#### Step 2: Login Member (Establishes Session Cookie)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "fit_sam",
    "password": "mypassword123"
  }'
```

#### Step 3: Fetch Member Profile & Remaining Days
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt
```

#### Step 4: Create a Fitness Class with Capacity 2
```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "HIIT Bootcamp",
    "trainerName": "John Doe",
    "scheduleDate": "2026-05-01T10:00:00.000Z",
    "durationMinutes": 60,
    "maxCapacity": 2
  }'
```

#### Step 5: Test Class Capacity Enforcement
- Book Member 1 into class: `POST /api/classes/<classId>/book` (Success `200 OK`)
- Book Member 2 into class: `POST /api/classes/<classId>/book` (Success `200 OK`)
- Attempt Book Member 3 into class: `POST /api/classes/<classId>/book`  
  *Result: Returns `400 Bad Request` with message `"Class capacity reached"`.*

#### Step 6: Test Membership Renewal
```bash
curl -X PATCH http://localhost:5000/api/members/<memberId>/renew \
  -H "Content-Type: application/json" \
  -d '{
    "additionalMonths": 6,
    "tier": "Platinum"
  }'
```

#### Step 7: Query Expired Members
```bash
curl -X GET http://localhost:5000/api/members/expired
```
