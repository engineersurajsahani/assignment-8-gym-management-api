# 🏋️‍♂️ Assignment 08: Gym & Fitness Club Management REST API

**Name:** Rishi Thakker
**Roll No:** 150096725068
**Cohort:** Sam Altman

**Deployed Link:** https://assignment-8-gym-management-api-oyul.onrender.com/

Backend for a Gym & Fitness Center Management System built with **Node.js, Express, MongoDB/Mongoose, and JWT authentication**.

## Features
- Member registration & login with JWT-based authentication (bcrypt password hashing)
- Automatic membership expiry date calculation on registration and renewal
- Fitness class CRUD with trainer filtering
- Capacity-checked class booking (blocks over-enrollment and expired members)
- Membership renewal and an "expired members" report

## Authentication
Auth uses **JWT**, not sessions. After logging in, copy the returned `token` and send it on every
protected route as a request header.


## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register a member. Body: `username, email, password, membershipTier, durationMonths, emergencyContact` |
| POST | `/login` | — | Login. Body: `email, password`. Returns a JWT `token` |
| GET | `/me` | Token | Get logged-in member profile (`daysRemaining` included) |

### Classes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/classes` | — | List upcoming classes. Query: `?trainer=John` |
| GET | `/classes/:id` | — | Class details + populated enrolled members |
| POST | `/classes` | Token | Create a class. Body: `title, trainerName, scheduleDate, durationMinutes, maxCapacity` |
| POST | `/classes/:id/book` | Token + active membership | Book a seat (400 if full or membership expired) |
| DELETE | `/classes/:id/cancel` | Token | Cancel your own booking |

### Members
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PATCH | `/members/:id/renew` | Token | Extend expiry. Body: `additionalMonths, tier` (optional) |
| GET | `/members/expired` | Token | List all members with a lapsed `membershipExpiryDate` |

## Testing Checklist (from assignment spec)
1. Register a member with `durationMonths: 1` → verify `membershipExpiryDate` is ~30 days out.
2. Create a class with `maxCapacity: 2`.
3. Book 3 different logged-in members into it → 3rd booking returns `400` with `"Class capacity reached"`.
4. Hit `GET /members/expired` and confirm only lapsed members show up.

Import the routes above into Postman (or use `curl`) — send the JWT `token` as a plain header
named `token` on every protected request, not `Authorization: Bearer`.

## Folder Structure
```text
rishi-thakker-068-assignment-8/
├── config/
│   └── db.js
├── middleware/
│   ├── authMiddleware.js
│   └── requestLogger.js
├── models/
│   ├── FitnessClass.js
│   └── User.js
├── router/
│   └── router.js
├── package.json
├── server.js
└── README.md
```
