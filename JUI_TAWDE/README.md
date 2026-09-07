# 🏋️‍♂️ Gym & Fitness Club Management REST API

A backend REST API built with Node.js, Express.js, MongoDB, Mongoose, Passport.js, and Express-Session for managing gym memberships, fitness classes, trainers, and bookings.

## 👩‍💻 Author

**Name:** Jui Tawde  
**Assignment:** 08 – Gym & Fitness Club Management REST API  
**Folder:** JUI_TAWDE

## 📌 Features

- Member registration and login
- Passport Local Strategy authentication
- Session-based authentication
- Password hashing with bcryptjs
- Membership tiers: Bronze, Silver, Gold, Platinum
- Automatic membership expiry calculation
- Membership renewal
- Expired membership listing
- Fitness class creation and retrieval
- Trainer-based class filtering
- Class capacity validation
- Class booking and cancellation
- Mongoose references and populate
- Active membership validation
- MongoDB persistence

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js
- Passport Local Strategy
- Express-Session
- bcryptjs
- dotenv
- cors

## 📁 Project Structure

```text
JUI_TAWDE/
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
├── server.js
└── README.md
```

## ⚙️ Setup

```bash
npm install
```

Create `.env`:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/gym_management
SESSION_SECRET=change_this_to_a_long_random_secret
```

Make sure MongoDB is running, then:

```bash
npm start
```

For development:

```bash
npm run dev
```

API:

```text
http://localhost:3000
```

## 🔐 Authentication

### Register

**POST** `/api/auth/register`

```json
{
  "username": "fit_jui",
  "email": "jui@example.com",
  "password": "password123",
  "membershipTier": "Gold",
  "durationMonths": 3
}
```

The membership expiry date is automatically calculated using 30 days per month.

### Login

**POST** `/api/auth/login`

```json
{
  "username": "fit_jui",
  "password": "password123"
}
```

### Current Member

**GET** `/api/auth/me`

Returns the authenticated member profile and remaining membership days.

### Logout

**POST** `/api/auth/logout`

Destroys the current session.

## 🏋️ Fitness Classes

### Get Upcoming Classes

**GET** `/api/classes`

Optional trainer filter:

```text
/api/classes?trainer=John
```

### Get Class

**GET** `/api/classes/:id`

### Create Class

**POST** `/api/classes`

```json
{
  "title": "Zumba Cardio",
  "trainerName": "Maria",
  "scheduleDate": "2026-10-15T09:00:00Z",
  "maxCapacity": 20
}
```

### Book Class

**POST** `/api/classes/:id/book`

Requires an authenticated member with an active membership.

If the class is full:

```json
{
  "message": "Class capacity reached."
}
```

### Cancel Booking

**DELETE** `/api/classes/:id/cancel`

Cancels the logged-in member's booking.

## 💳 Membership Management

### Renew Membership

**PATCH** `/api/members/:id/renew`

```json
{
  "additionalMonths": 6,
  "tier": "Platinum"
}
```

### Get Expired Members

**GET** `/api/members/expired`

Returns members whose membership expiry date is earlier than the current date.

## 🧪 Testing Flow

1. Start MongoDB.
2. Start the API.
3. Register a member with a 1-month membership.
4. Verify the generated expiry date.
5. Login using Passport Local Strategy.
6. Create a class with `maxCapacity: 2`.
7. Book the class with two members.
8. Attempt a third booking and verify `400 Class capacity reached`.
9. Test `/api/auth/me`.
10. Renew a membership.
11. Test `/api/members/expired`.

## 📋 Endpoint Summary

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register member |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Member profile |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/classes` | Upcoming classes |
| GET | `/api/classes/:id` | Class details |
| POST | `/api/classes` | Create class |
| POST | `/api/classes/:id/book` | Book class |
| DELETE | `/api/classes/:id/cancel` | Cancel booking |
| PATCH | `/api/members/:id/renew` | Renew membership |
| GET | `/api/members/expired` | List expired members |

## 🎯 Assignment Requirements Covered

- Mongoose schemas and validation
- MongoDB persistence
- Membership expiry date calculation
- Membership status checks
- Membership renewal
- Passport Local Strategy
- Express-Session authentication
- bcrypt password hashing
- Fitness class management
- Mongoose references and populate
- Class capacity validation
- Booking and cancellation
- Modular controllers, routes, middleware, and configuration
- HTTP status codes and error handling

## 👩‍💻 Author

**Jui Tawde**

**Assignment 08 – Gym & Fitness Club Management REST API**
