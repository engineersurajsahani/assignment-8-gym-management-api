# 🏋️‍♂️ Gym & Fitness Club Management API

A full-featured backend API for managing gym memberships, fitness classes, and bookings using Node.js, Express, MongoDB, and Passport.js authentication.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)

## ✨ Features

- **User Authentication** - Register and login with Passport.js Local Strategy
- **Membership Management** - Bronze, Silver, Gold, Platinum tiers with automatic expiry calculation
- **Fitness Classes** - CRUD operations with capacity management
- **Class Booking** - Enroll/cancel with automatic capacity validation
- **Session-Based Auth** - Secure session management with express-session
- **Bcrypt Hashing** - Passwords securely hashed with bcryptjs

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Passport.js (Local Strategy)
- **Session:** express-session
- **Password Hashing:** bcryptjs

## 📁 Project Structure

```
gym-api/
├── config/
│   ├── db.js                # MongoDB connection
│   └── passport.js          # Passport Local strategy
├── controllers/
│   ├── authController.js    # Register, login, profile
│   ├── classController.js   # Class CRUD & booking
│   └── memberController.js  # Membership renewal & expiry
├── middleware/
│   ├── authMiddleware.js    # Authentication check
│   └── checkActiveMember.js # Active membership check
├── models/
│   ├── User.js              # User/Membership schema
│   └── FitnessClass.js      # Fitness class schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── classRoutes.js       # Class endpoints
│   └── memberRoutes.js      # Member endpoints
├── .env                     # Environment variables
├── .env.example             # Example env file
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gym-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MongoDB connection string:
   ```
   MONGO_URI=mongodb://localhost:27017/gym_management
   SESSION_SECRET=your-secret-key
   PORT=5000
   ```

4. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify the server**
   ```bash
   curl http://localhost:5000/api/health
   ```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new member | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

#### Register
```json
POST /api/auth/register
{
  "username": "fit_sam",
  "email": "sam@fit.com",
  "password": "mypassword",
  "membershipTier": "Gold",
  "durationMonths": 3
}
```

#### Login
```json
POST /api/auth/login
{
  "username": "fit_sam",
  "password": "mypassword"
}
```

### Fitness Classes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/classes` | Get all classes | No |
| GET | `/api/classes/:id` | Get class details | No |
| POST | `/api/classes` | Create new class | Yes |
| POST | `/api/classes/:id/book` | Book a class | Yes |
| DELETE | `/api/classes/:id/cancel` | Cancel booking | Yes |

#### Create Class
```json
POST /api/classes
{
  "title": "Zumba Cardio",
  "trainerName": "Maria",
  "scheduleDate": "2026-04-15T09:00:00Z",
  "maxCapacity": 20
}
```

#### Filter by Trainer
```bash
GET /api/classes?trainer=John
```

### Membership Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PATCH | `/api/members/:id/renew` | Renew membership | Yes |
| GET | `/api/members/expired` | Get expired memberships | No |
| GET | `/api/members/:id` | Get member by ID | Yes |

#### Renew Membership
```json
PATCH /api/members/:id/renew
{
  "additionalMonths": 6,
  "tier": "Platinum"
}
```

## 🧪 Testing

### Using cURL

```bash
# Register a new member
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","membershipTier":"Gold","durationMonths":3}'

# Login and save session cookie
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Get profile (with session cookie)
curl -b cookies.txt http://localhost:5000/api/auth/me

# Create a class
curl -b cookies.txt -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -d '{"title":"HIIT Bootcamp","trainerName":"John","scheduleDate":"2026-04-15T09:00:00Z","maxCapacity":2}'

# Book the class
curl -b cookies.txt -X POST http://localhost:5000/api/classes/<class-id>/book
```

### Testing Capacity Limit

1. Create a class with `maxCapacity: 2`
2. Register 3 different users
3. Book the class with 2 users (should succeed)
4. Try booking with the 3rd user (should fail with "Class capacity reached")

### Testing Membership Expiry

1. Register a user with 1-month membership
2. Verify `membershipExpiryDate` is ~30 days in the future
3. Wait or manually update the date in MongoDB
4. Call `GET /api/members/expired` to see expired members

## 📝 Notes

- Session cookies are used for authentication (not JWT)
- Passwords are hashed with bcryptjs before storage
- Membership expiry is automatically calculated from registration date
- Class booking checks both capacity and membership status
- Expired members cannot book new classes

## 🐛 Troubleshooting

**Server won't start:**
- Check if MongoDB is running
- Verify `MONGO_URI` in `.env`
- Ensure port 5000 is not in use

**Authentication not working:**
- Ensure cookies are enabled in your client
- Check that session secret is set in `.env`

**Class booking fails:**
- Verify membership is active
- Check if class has available capacity

---

**Assignment 08:** Gym & Fitness Club Management REST API
