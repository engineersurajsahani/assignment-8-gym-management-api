# 🏋️‍♂️ Assignment 08: Gym & Fitness Club Management REST API

A backend API for a Gym & Fitness Center Management System built with **Node.js, Express, MongoDB, Mongoose, and Passport.js (Local Strategy)**.

## Features

- Member registration & session-based login (Passport local strategy, bcrypt password hashing)
- Auto-calculated membership expiry dates based on chosen plan duration
- Fitness class CRUD with trainer filtering
- Class booking with **seat capacity enforcement** and membership-expiry checks
- Booking cancellation
- Membership renewal (extends expiry, updates tier)
- Expired-membership lookup

## Setup

```bash
npm install
cp .env.example .env   # then edit .env with your MongoDB URI and session secret
npm run dev             # nodemon, for local development
# or
npm start
```

Requires a running MongoDB instance (local or Atlas) reachable at the `MONGODB_URI` in `.env`.

## Environment Variables (`.env`)

| Variable         | Description                              |
| ---------------- | ----------------------------------------- |
| `PORT`           | Port the server listens on (default 5000) |
| `MONGODB_URI`    | MongoDB connection string                 |
| `SESSION_SECRET` | Secret used to sign the session cookie    |

## API Reference

### Auth

| Method | Endpoint             | Auth | Description                                  |
| ------ | --------------------- | ---- | --------------------------------------------- |
| POST   | `/api/auth/register`  | No   | Register a new member                        |
| POST   | `/api/auth/login`     | No   | Log in (creates session)                     |
| POST   | `/api/auth/logout`    | Yes  | Log out (destroys session)                   |
| GET    | `/api/auth/me`        | Yes  | Get current member profile + remaining days  |

Register body example:
```json
{
  "username": "fit_sam",
  "email": "sam@fit.com",
  "password": "mypassword",
  "membershipTier": "Gold",
  "durationMonths": 3
}
```

### Fitness Classes

| Method | Endpoint                    | Auth | Description                                              |
| ------ | ---------------------------- | ---- | ---------------------------------------------------------- |
| GET    | `/api/classes`               | No   | List upcoming classes (`?trainer=John` to filter)          |
| GET    | `/api/classes/:id`           | No   | Get class details + enrolled members                       |
| POST   | `/api/classes`               | No   | Create a new class                                          |
| POST   | `/api/classes/:id/book`      | Yes  | Book the logged-in member (fails if full/expired)          |
| DELETE | `/api/classes/:id/cancel`    | Yes  | Cancel the logged-in member's booking                      |

### Membership

| Method | Endpoint                  | Auth | Description                              |
| ------ | -------------------------- | ---- | ------------------------------------------ |
| PATCH  | `/api/members/:id/renew`   | Yes  | Extend expiry / change tier               |
| GET    | `/api/members/expired`     | Yes  | List all members with expired plans       |

## Testing Checklist

1. Register a member with `durationMonths: 1` and confirm `membershipExpiryDate` is ~30 days out.
2. Create a class with `maxCapacity: 2`, book 3 different members — the 3rd should get `400 Bad Request: Class capacity reached`.
3. Try booking with an expired member — should be blocked by `checkActiveMember` middleware.
4. Hit `GET /api/members/expired` and confirm only members with `membershipExpiryDate < now` are returned.
5. Renew an expired member and confirm their status flips back to `active` and expiry moves into the future.

## Project Structure

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
├── server.js
└── README.md
```
