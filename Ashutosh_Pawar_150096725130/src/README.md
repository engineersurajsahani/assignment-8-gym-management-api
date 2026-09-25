# Gym and Fitness Club Management API

REST API for a gym. MongoDB with Mongoose for storage, Passport Local with
express-session for login, bcrypt for passwords. A plain HTML frontend in
`public/` is served by the same server.

## Setup

```bash
npm install
cp src/.env.example src/.env
npm run dev
```

- API: `http://localhost:3000/api/...`
- Frontend: `http://localhost:3000/index.html`
- Requests to try: `src/test.http`

### Making an admin

Creating, editing and deleting classes and viewing expired members need an
admin. Register a normal account, then promote it:

```bash
npm run make-admin -- <username>
```

## Endpoints

### Auth

| Method | Path                 | Access    | Status codes    |
| ------ | -------------------- | --------- | --------------- |
| POST   | `/api/auth/register` | Public    | 201, 400, 409   |
| POST   | `/api/auth/login`    | Public    | 200, 400, 401   |
| GET    | `/api/auth/me`       | Logged in | 200, 401        |
| POST   | `/api/auth/logout`   | Public    | 200             |

### Classes

| Method | Path                      | Access        | Status codes       |
| ------ | ------------------------- | ------------- | ------------------ |
| GET    | `/api/classes`            | Public        | 200                |
| GET    | `/api/classes/mine`       | Logged in     | 200, 401           |
| GET    | `/api/classes/:id`        | Public        | 200, 404           |
| POST   | `/api/classes`            | Admin         | 201, 400, 403      |
| PUT    | `/api/classes/:id`        | Admin         | 200, 400, 404      |
| DELETE | `/api/classes/:id`        | Admin         | 200, 404           |
| POST   | `/api/classes/:id/book`   | Active member | 200, 400, 404      |
| DELETE | `/api/classes/:id/cancel` | Logged in     | 200, 400, 404      |

`GET /api/classes` returns only upcoming classes, sorted by date. `?trainer=`
matches part of the trainer name, case-insensitive.

### Members

| Method | Path                      | Access         | Status codes       |
| ------ | ------------------------- | -------------- | ------------------ |
| PATCH  | `/api/members/:id/renew`  | Self or admin  | 200, 400, 403, 404 |
| GET    | `/api/members/expired`    | Admin          | 200, 403           |

## How it works

- **Membership dates.** `User` has a `remainingDays` virtual, an `isExpired()`
  method, and `extendMembership(months)`, which adds 30 days per month. It
  counts from the current expiry date, or from today if the membership has
  already lapsed. A `pre("save")` hook sets `membershipStatus` to `expired`
  once the date has passed.
- **Class rules.** `FitnessClass` has `seatsLeft` and `endTime` virtuals. A
  `pre("validate")` hook rejects a new class scheduled in the past, and blocks
  lowering `maxCapacity` below the number already enrolled.
- **Booking.** One `findOneAndUpdate` checks "not full, not already booked,
  not started" and pushes the member in the same operation. Two members can
  never both take the last seat. The class id is also kept in the user's
  `enrolledClasses`.
- **Expired members.** `checkActiveMember` blocks booking when the membership
  is expired or frozen. `/api/members/expired` marks lapsed members as
  `expired` and lists everyone whose `membershipExpiryDate < now`.
- **Passwords** are never returned: `toJSON` on `User` strips them.
