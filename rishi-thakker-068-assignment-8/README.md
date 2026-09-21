# 🏋️‍♂️ Gym & Fitness Club Management REST API

Backend for a Gym & Fitness Center Management System built with **Node.js, Express, MongoDB/Mongoose, and Passport.js (Local Strategy)**.

## Features
- Member registration & session-based login (Passport Local + bcrypt password hashing)
- Automatic membership expiry date calculation on registration and renewal
- Fitness class CRUD with trainer filtering
- Capacity-checked class booking (blocks over-enrollment and expired members)
- Membership renewal and an "expired members" report

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env with your MongoDB URI and a real session secret

# 3. Run in dev mode (auto-restart)
npm run dev

# or run normally
npm start
```

Make sure MongoDB is running locally, or point `MONGO_URI` in `.env` at your Atlas / hosted cluster.

## Environment Variables (`.env`)
| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret used to sign the session cookie |
| `NODE_ENV` | `development` or `production` |

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a member. Body: `username, email, password, membershipTier, durationMonths, emergencyContact` |
| POST | `/api/auth/login` | — | Login. Body: `username, password` |
| POST | `/api/auth/logout` | Session | Destroy session |
| GET | `/api/auth/me` | Session | Get logged-in member profile (`daysRemaining` included) |

### Classes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/classes` | — | List upcoming classes. Query: `?trainer=John` |
| GET | `/api/classes/:id` | — | Class details + populated enrolled members |
| POST | `/api/classes` | — | Create a class. Body: `title, trainerName, scheduleDate, durationMinutes, maxCapacity` |
| POST | `/api/classes/:id/book` | Session + active membership | Book a seat (400 if full or membership expired) |
| DELETE | `/api/classes/:id/cancel` | Session | Cancel your own booking |

### Members
| Method | Endpoint | Description |
|---|---|---|
| PATCH | `/api/members/:id/renew` | Extend expiry. Body: `additionalMonths, tier` (optional) |
| GET | `/api/members/expired` | List all members with a lapsed `membershipExpiryDate` |

## Testing Checklist (from assignment spec)
1. Register a member with `durationMonths: 1` → verify `membershipExpiryDate` is ~30 days out.
2. Create a class with `maxCapacity: 2`.
3. Book 3 different logged-in members into it → 3rd booking returns `400` with `"Class capacity reached"`.
4. Hit `GET /api/members/expired` and confirm only lapsed members show up.

Import the routes above into Postman (or use `curl`) — remember to enable cookie/session
persistence in Postman (Settings → "Automatically follow redirects" and keep cookie jar on)
since auth relies on `express-session` cookies, not JWTs.

## Folder Structure
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
├── server.js
└── README.md
```
