# Assignment 08 - Gym & Fitness Club Management REST API

Submitted by: **Aditya Kumbhar**
Live Link: https://assignment-8-gym-management-api-03gy.onrender.com

A backend REST API for managing a gym/fitness club - member registration & login,
class bookings with a seat limit, and membership renewals. Built with Node.js,
Express and MongoDB (Mongoose) as part of the backend assignment.

## Tech Stack

- Node.js + Express
- MongoDB with Mongoose
- Passport.js (Local Strategy) + express-session for auth
- bcryptjs for password hashing
- dotenv for env variables

## Folder Structure

```
Aditya Kumbhar/
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

## Setup

1. Install dependencies
   ```
   npm install
   ```
2. Create a `.env` file in the root (use `.env.example` as reference)
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   SESSION_SECRET=anysecretkey
   ```
3. Run the server
   ```
   npm run dev
   ```
   (uses nodemon, or `npm start` for normal node)

## API Endpoints

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register a new member (username, email, password, membershipTier, durationMonths) |
| POST | /api/auth/login | Login with username + password |
| GET | /api/auth/me | Get logged in member's profile + days left on membership |
| POST | /api/auth/logout | Logout |

### Fitness Classes

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/classes | Get all upcoming classes (supports `?trainer=name`) |
| GET | /api/classes/:id | Get one class with list of enrolled members |
| POST | /api/classes | Create a new class |
| POST | /api/classes/:id/book | Book a class (fails if full or membership expired) |
| DELETE | /api/classes/:id/cancel | Cancel your booking |

### Membership

| Method | Endpoint | Description |
|---|---|---|
| PATCH | /api/members/:id/renew | Renew/extend a member's plan (additionalMonths, tier) |
| GET | /api/members/expired | Get list of all members with expired membership |

## Notes

- `membershipExpiryDate` is calculated automatically on registration using a
  mongoose `pre("validate")` hook in the `User` model - it takes `durationMonths`
  from the request and adds that many months from today's date.
- Booking a class checks two things - the class isn't already full
  (`maxCapacity` vs `enrolledMembers.length`) and the member's plan hasn't expired
  (handled by the `checkActiveMember` middleware).
- Auth is session based (not JWT) using Passport's local strategy, so login/logout
  work through cookies.

## Testing

Tested manually with Postman:
- Registered a member with `durationMonths: 1` and checked the expiry date was set ~30 days ahead.
- Created a class with `maxCapacity: 2`, booked 2 members successfully, 3rd booking returned `400 Class capacity reached`.
- Hit `/api/members/expired` after manually setting an old expiry date in the DB to confirm the filter works.
