# 🏋️ Assignment 08 — Gym & Fitness Club Management REST API

Backend Development assignment based on the specification in the reference repository README.

Live link: https://assignment-8-gym-management-api-x9gw.onrender.com

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js (Local Strategy)
- Express-Session
- bcryptjs
- dotenv
- cors

## Project Structure

```text
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
├── README.md
└── server.js
```

## Setup

1. Make sure MongoDB is running locally, or use a MongoDB Atlas connection string.
2. Install dependencies:

```bash
npm install
```

3. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

4. Update `MONGO_URI` and `SESSION_SECRET` in `.env`.
5. Start the API:

```bash
npm run dev
```

or:

```bash
npm start
```

The default server is `http://localhost:5000`.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a member and calculate membership expiry |
| POST | `/api/auth/login` | Login with Passport Local Strategy |
| GET | `/api/auth/me` | Get logged-in member profile and remaining days |
| POST | `/api/auth/logout` | Destroy the current session |

Register example:

```json
{
  "username": "fit_sam",
  "email": "sam@fit.com",
  "password": "mypassword",
  "membershipTier": "Gold",
  "durationMonths": 3,
  "emergencyContact": "9876543210"
}
```

### Fitness Classes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/classes` | Fetch upcoming classes |
| GET | `/api/classes?trainer=John` | Filter by trainer |
| GET | `/api/classes/:id` | Get class with enrolled members |
| POST | `/api/classes` | Create a class |
| POST | `/api/classes/:id/book` | Book class for logged-in active member |
| DELETE | `/api/classes/:id/cancel` | Cancel current member's booking |

Create class example:

```json
{
  "title": "Zumba Cardio",
  "trainerName": "Maria",
  "scheduleDate": "2027-04-15T09:00:00Z",
  "durationMinutes": 60,
  "maxCapacity": 20
}
```

### Membership Management

| Method | Endpoint | Description |
|---|---|---|
| PATCH | `/api/members/:id/renew` | Extend membership and optionally change tier |
| GET | `/api/members/expired` | List expired memberships |

Renew example:

```json
{
  "additionalMonths": 6,
  "tier": "Platinum"
}
```

## Important Assignment Logic

### Membership expiry
Registration calculates `membershipExpiryDate` from the current date plus `durationMonths`.

### Password security
Passwords are hashed with bcryptjs in a Mongoose `pre('save')` hook. Passwords are never returned by the safe user response.

### Passport session authentication
Passport Local Strategy checks username and password. Successful login creates a session, and protected routes use `req.isAuthenticated()`.

### Active membership check
Booking requires an authenticated member whose membership is active and whose expiry date has not passed.

### Class capacity
A booking is rejected with HTTP 400 and `Class capacity reached` when `enrolledMembers.length >= maxCapacity`.

### Mongoose references
`FitnessClass.enrolledMembers` stores `User` ObjectIds and class details can populate member information.

## Testing Checklist

1. Register a member with `durationMonths: 1` and inspect `membershipExpiryDate`.
2. Login with the registered username/password.
3. Call `/api/auth/me` with the same session.
4. Create a class with `maxCapacity: 2`.
5. Book two members.
6. Attempt a third booking and verify HTTP 400 with `Class capacity reached`.
7. Cancel a booking and verify the member is removed.
8. Renew a membership using `/api/members/:id/renew`.
9. Call `/api/members/expired` and verify expired users are listed.

## Postman Session Note

Because this assignment uses Express sessions, keep cookies enabled in Postman. After a successful login, Postman should retain the `connect.sid` cookie for protected requests.

## Submission

Suggested repository name:

`itm-assignment-08-gym-api`
