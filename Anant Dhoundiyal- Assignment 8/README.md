# 🏋️‍♂️ Gym & Fitness Club Management API

A REST API for a gym/fitness center — membership lifecycle, class bookings with capacity limits, and Passport.js session authentication — built with **Node.js, Express, MongoDB, Mongoose, and Passport (Local Strategy)**.

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose (schemas, `pre-save` hooks, `populate`)
- Passport.js (`passport-local`) + `express-session` for stateful auth
- `bcryptjs` for password hashing

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **MongoDB**
   - Local: install MongoDB Community Server and make sure `mongod` is running on `mongodb://127.0.0.1:27017`.
   - Or use a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and grab its connection string.

3. **Environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in `MONGO_URI` (local or Atlas) and `SESSION_SECRET`.

4. **Run**
   ```bash
   npm run dev     # nodemon
   # or
   npm start
   ```

## How Auth Works Here

This assignment uses **Passport's Local Strategy** with **server-side sessions** (not JWT). `POST /api/auth/login` runs your credentials through Passport, and on success Express sets a `connect.sid` session cookie. Your HTTP client needs to store and resend that cookie on every subsequent request (Postman does this automatically with cookie jar; with curl use `-c`/`-b`). `authMiddleware` checks `req.isAuthenticated()` on protected routes.

## Endpoints

**Auth**
- `POST /api/auth/register` — `{ username, email, password, membershipTier?, durationMonths?, emergencyContact? }`. Calculates `membershipExpiryDate` as `today + durationMonths` (defaults to 1 month if omitted).
- `POST /api/auth/login` — `{ username, password }`, starts a session
- `POST /api/auth/logout` — destroys the session
- `GET /api/auth/me` — current member's profile plus `remainingDays` until expiry (requires login)

**Fitness Classes**
- `GET /api/classes?trainer=` — upcoming classes (scheduleDate ≥ now), optional case-insensitive trainer filter, includes `seatsAvailable`
- `GET /api/classes/:id` — full class detail with `enrolledMembers` populated (username, email, tier)
- `POST /api/classes` — create a class: `{ title, trainerName, scheduleDate, durationMinutes?, maxCapacity }`
- `POST /api/classes/:id/book` — enroll the logged-in member (requires login + active, non-expired membership). Uses an atomic `findOneAndUpdate` with a capacity guard so two simultaneous bookings can't both slip into the last seat.
- `DELETE /api/classes/:id/cancel` — remove the logged-in member's booking (requires login)

**Membership Management**
- `PATCH /api/members/:id/renew` — `{ additionalMonths, tier? }`. Extends from the current expiry date if still active, or from today if already expired.
- `GET /api/members/expired` — all members whose `membershipExpiryDate` has passed

## Key Design Notes

- **`pre-save` hook** on `User` keeps `membershipStatus` (`active`/`expired`) in sync with `membershipExpiryDate` automatically, unless a member has been manually set to `frozen`.
- **Booking race-condition safety**: `bookClass` uses a single atomic `findOneAndUpdate` with a `$expr` capacity check rather than a read-then-write, so concurrent booking requests can't both succeed past `maxCapacity`.
- **Membership expiry gate**: `checkActiveMember` middleware re-checks the live expiry date (not a potentially stale `membershipStatus` field) before allowing a booking.
- Passwords are bcrypt-hashed (10 rounds) and stripped from every response.

## Testing Checklist (from the assignment spec)

1. Register a member with `durationMonths: 1` → confirm `membershipExpiryDate` is ~30 days out.
2. Create a class with `maxCapacity: 2`.
3. Book 2 members successfully, then attempt a 3rd → expect `400 Bad Request: Class capacity reached`.
4. `GET /api/members/expired` → confirm it lists only members past their expiry date.

## Project Structure

```
gym-management-api/
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
