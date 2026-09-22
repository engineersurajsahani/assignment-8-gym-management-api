# Gym & Fitness Club Management REST API

A beginner-friendly REST API built for college **Assignment 08**. It manages gym members, membership plans, and fitness class bookings using **Node.js + Express + MongoDB (Mongoose)** and authenticates users with **Passport Local Strategy + Express Sessions** (no JWT).

---

## Description

This API lets you:

- Register gym members with a membership plan (Bronze, Silver, Gold, Platinum).
- Automatically calculate membership expiry (30 days per month).
- Renew memberships (active memberships extend from the current expiry; expired memberships renew from today).
- Create and list fitness classes.
- Book fitness classes with strict **capacity validation** (no over-enrollment).
- Cancel bookings and free up seats.
- Track expired members.
- Log in / log out with a session-based Passport authentication.

All data persists in **MongoDB**.

---

## Technologies

| Technology          | Purpose                                   |
| ------------------- | ----------------------------------------- |
| Node.js             | JavaScript runtime                        |
| Express.js          | Web framework / routing                   |
| MongoDB             | Database                                  |
| Mongoose            | ODM — schemas, models, validation, populate |
| Passport.js         | Authentication framework                  |
| Passport Local      | Username + password strategy              |
| Express Session     | Session storage for logged-in users       |
| bcryptjs            | Password hashing                          |
| dotenv              | Environment variables                     |
| cors                | Cross-origin resource sharing             |
| nodemon             | Auto-restart during development (dev only)|

---

## Project Structure

```
assignment-08-gym-api/
├── config/
│   ├── db.js                 # MongoDB connection (connectDB)
│   └── passport.js           # LocalStrategy + serialize/deserialize
├── controllers/
│   ├── authController.js     # register, login, me, logout
│   ├── classController.js    # class CRUD, booking, cancellation
│   └── memberController.js   # renew membership, expired members
├── middleware/
│   ├── authMiddleware.js     # requires a logged-in session (401 otherwise)
│   └── checkActiveMember.js  # requires active (non-expired, non-frozen) membership
├── models/
│   ├── FitnessClass.js       # class schema with enrolledMembers ref
│   └── User.js               # member schema + pre('save') expiry hook
├── routes/
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── classRoutes.js        # /api/classes endpoints
│   └── memberRoutes.js       # /api/members endpoints
├── data/
│   ├── users.json            # sample members (username + password + plan)
│   ├── classes.json          # sample upcoming fitness classes
│   └── seed.js               # idempotent seed runner (npm run seed)
├── .env.example              # environment template
├── .gitignore
├── package.json
├── Gym-Fitness-API.postman_collection.json   # Postman test suite
├── render.yaml               # optional Render blueprint
├── ASSIGNMENT-SPEC.md        # original assignment brief
├── server.js                 # Express app entry point
├── README.md

**Folder responsibilities**

- `models/` — Mongoose database schemas.
- `controllers/` — business logic.
- `routes/` — API endpoint definitions.
- `middleware/` — authentication and membership checks.
- `config/` — database connection and Passport setup.

---

## Installation

```bash
npm install
```

---

## MongoDB Setup

Install MongoDB Community (via Homebrew on macOS or the official installer for Windows).

Start the service locally:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Manual foreground start
mongod --dbpath /usr/local/var/mongodb
```

The application connects to:

```
mongodb://127.0.0.1:27017/gym_management
```

> The `gym_management` database is created **automatically** the first time data is inserted — you do not need to create it manually.

---

## Environment Setup

```bash
cp .env.example .env
```

| Variable          | Example                                                  | Purpose                          |
| ----------------- | -------------------------------------------------------- | -------------------------------- |
| `PORT`            | `3000`                                                   | Port the server listens on       |
| `MONGODB_URI`     | `mongodb://127.0.0.1:27017/gym_management`               | MongoDB connection string        |
| `SESSION_SECRET`  | `your_super_secret_session_key`                          | Secret used to sign session      |
| `CLIENT_ORIGIN`   | `http://localhost:3000` (comma-separated list allowed)   | Origins allowed to make browser requests (CORS) |

`.env` is ignored by Git (see `.gitignore`).

---

## Running

Development (auto-restart with nodemon):

```bash
npm run dev
```

Basic / production start:

```bash
npm start
```

Server starts on `http://localhost:3000`. Verify with:

```
GET /api/health
```

---

## Seed Data (test immediately)

The project ships with sample members and classes so it can be tested right away:

| File                | Description                                        |
| ------------------- | -------------------------------------------------- |
| `data/users.json`   | 4 sample members (username + password + plan)      |
| `data/classes.json` | 4 sample upcoming fitness classes                  |
| `data/seed.js`      | Idempotent loader — safe to re-run (`npm run seed`) |

```bash
# 1. Make sure .env exists (see Environment Setup)
cp .env.example .env
# 2. Point MONGODB_URI at your database, then:
npm run seed
```

Seeded members (passwords are bcrypt-hashed on insert):

| Username     | Email            | Password     | Tier     | Duration |
| ------------ | ---------------- | ------------ | -------- | -------- |
| `fit_sam`    | `sam@fit.com`    | `mypassword` | Gold     | 3 months |
| `muscle_man` | `muscle@fit.com` | `mypassword` | Platinum | 6 months |
| `yoga_amy`   | `amy@fit.com`    | `mypassword` | Bronze   | 1 month  |
| `runner_raj` | `raj@fit.com`    | `mypassword` | Silver   | 2 months |

You can then log in as `fit_sam` / `mypassword` and book the seeded **HIIT Bootcamp**
(`maxCapacity: 2`) to verify the capacity limit.

---

## API Documentation

Base URL: `http://localhost:3000`

### Health

| Method | URL          | Auth | Description            |
| ------ | ------------ | ---- | ---------------------- |
| GET    | `/api/health`| No   | API status check       |

Response: `200`

```json
{
  "status": "OK",
  "message": "Gym API is running"
}
```

---

### Authentication

#### POST `/api/auth/register`

| Method | URL                  | Auth | Description                     |
| ------ | -------------------- | ---- | ------------------------------- |
| POST   | `/api/auth/register` | No   | Register a new member           |

Request body:

```json
{
  "username": "fit_sam",
  "email": "sam@fit.com",
  "password": "mypassword",
  "membershipTier": "Gold",
  "durationMonths": 3
}
```

`durationMonths` sets the membership length using the **30 days per month** rule (`durationMonths × 30 days`).

Response: `201`

```json
{
  "message": "Member registered successfully",
  "user": {
    "id": "65f1...",
    "username": "fit_sam",
    "email": "sam@fit.com",
    "membershipTier": "Gold",
    "membershipStatus": "active",
    "membershipExpiryDate": "2026-06-...T00:00:00.000Z",
    "emergencyContact": null
  }
}
```

Errors: `400` (validation / username/email taken), `500` (server).

---

#### POST `/api/auth/login`

| Method | URL               | Auth | Description          |
| ------ | ----------------- | ---- | -------------------- |
| POST   | `/api/auth/login` | No   | Log in with Passport |

Request body:

```json
{
  "username": "fit_sam",
  "password": "mypassword"
}
```

Response: `200` (a session cookie is set automatically)

```json
{
  "message": "Login successful",
  "user": { "id": "...", "username": "fit_sam", "email": "sam@fit.com", "...": "..." }
}
```

Error: `401` for invalid credentials.

---

#### POST `/api/auth/logout`

| Method | URL                | Auth | Description               |
| ------ | ------------------ | ---- | ------------------------- |
| POST   | `/api/auth/logout` | Yes  | Destroy the session       |

Response: `200`

```json
{ "message": "Logout successful" }
```

After logout, protected endpoints return `401`.

---

#### GET `/api/auth/me`

| Method | URL                | Auth | Description                       |
| ------ | ------------------ | ---- | --------------------------------- |
| GET    | `/api/auth/me`     | Yes  | Current logged-in member + days remaining |

Response: `200`

```json
{
  "user": { "id": "...", "username": "fit_sam", "email": "sam@fit.com", "...": "..." },
  "remainingDays": 72
}
```

`remainingDays` is calculated **dynamically** and is never stored in MongoDB. If the membership has expired, the status is updated to `"expired"`.

Error: `401` when not authenticated.

---

### Fitness Classes

#### GET `/api/classes`

| Method | URL           | Auth | Description                          |
| ------ | ------------- | ---- | ------------------------------------ |
| GET    | `/api/classes`| No   | List upcoming classes                |

Optional query: `?trainer=John` (case-insensitive trainer filter).

Response: `200`

```json
{
  "count": 2,
  "classes": [ { "title": "HIIT Bootcamp", "trainerName": "John", "...": "..." } ]
}
```

Only upcoming classes (`scheduleDate >= now`) are returned, sorted by `scheduleDate` ascending.

---

#### GET `/api/classes/:id`

| Method | URL                | Auth | Description                      |
| ------ | ------------------ | ---- | -------------------------------- |
| GET    | `/api/classes/:id` | No   | Class details with enrolled members populated |

Response: `200`

```json
{
  "id": "...",
  "title": "HIIT Bootcamp",
  "trainerName": "John",
  "scheduleDate": "2026-12-15T09:00:00.000Z",
  "durationMinutes": 60,
  "maxCapacity": 2,
  "enrolledMembers": [
    { "username": "fit_sam", "email": "sam@fit.com", "membershipTier": "Gold" }
  ]
}
```

Passwords are never populated. Errors: `404` (not found), `400` (invalid id).

---

#### POST `/api/classes`

| Method | URL           | Auth | Description    |
| ------ | ------------- | ---- | -------------- |
| POST   | `/api/classes`| No   | Create a class |

Request body:

```json
{
  "title": "Zumba Cardio",
  "trainerName": "Maria",
  "scheduleDate": "2026-04-15T09:00:00Z",
  "durationMinutes": 60,
  "maxCapacity": 20
}
```

`durationMinutes` is optional and defaults to `60`.

Response: `201` with the created class. Errors: `400` for invalid input.

---

#### POST `/api/classes/:id/book`

| Method | URL                     | Auth | Description                          |
| ------ | ----------------------- | ---- | ------------------------------------ |
| POST   | `/api/classes/:id/book` | Yes  | Book a class (requires active membership) |

No request body required (uses the logged-in session user).

Response: `200`

```json
{ "message": "Class booked successfully", "class": { "...": "..." } }
```

Errors:

- `400` — `Class capacity reached` (capacity full)
- `400` — `You are already enrolled in this class` (duplicate booking)
- `400` — `Membership has expired` / `Membership is frozen`
- `404` — `Class not found`

---

#### DELETE `/api/classes/:id/cancel`

| Method | URL                        | Auth | Description              |
| ------ | -------------------------- | ---- | ------------------------ |
| DELETE | `/api/classes/:id/cancel`  | Yes  | Cancel the logged-in user's booking |

Response: `200`

```json
{ "message": "Class booking cancelled successfully" }
```

The freed seat becomes available for other members. Errors: `404` (class missing), `400` (`You are not enrolled in this class`).

---

### Membership

#### PATCH `/api/members/:id/renew`

| Method | URL                        | Auth | Description                |
| ------ | -------------------------- | ---- | -------------------------- |
| PATCH  | `/api/members/:id/renew`   | No  | Renew / upgrade a membership |

Request body:

```json
{ "additionalMonths": 6, "tier": "Platinum" }
```

Rules (30 days per month):

- Active membership → new expiry = **existing expiry + months × 30 days**.
- Expired membership → new expiry = **today + months × 30 days**.

Response: `200`

```json
{
  "message": "Membership renewed successfully",
  "member": { "membershipTier": "Platinum", "membershipStatus": "active", "..." : "..." }
}
```

Errors: `404` (member not found), `400` (invalid `additionalMonths` / `tier`).

---

#### GET `/api/members/expired`

| Method | URL                    | Auth | Description              |
| ------ | ---------------------- | ---- | ------------------------ |
| GET    | `/api/members/expired` | No  | List all expired members |

Response: `200`

```json
{
  "count": 2,
  "members": [
    { "username": "old_member", "email": "old@example.com", "membershipStatus": "expired", "..." : "..." }
  ]
}
```

Matching members have their stored status synced to `"expired"`. Passwords are never returned.

---

## Status Codes

| Code | Meaning                                             |
| ---- | --------------------------------------------------- |
| 200  | Successful request                                  |
| 201  | Resource created                                    |
| 400  | Invalid input / full class / expired membership / duplicate booking |
| 401  | Not authenticated / invalid login                   |
| 404  | Resource not found                                  |
| 500  | Unexpected server error                             |

---

## Key Logic

- **Membership expiry** — `membershipExpiryDate = now + durationMonths × 30 days`, computed by a Mongoose `pre('save')` hook on `User` (`models/User.js`).
- **Capacity validation** — booking checks `enrolledMembers.length >= maxCapacity` before adding and rejects over-enrollment with `Class capacity reached`.
- **Duplicate booking** — the same member cannot enroll in the class twice.
- **Active membership middleware** — booking requires the member to be authenticated **and** have a non-expired, non-frozen membership.
- **Password security** — bcryptjs hashing (10 rounds) at registration; `bcrypt.compare` at login; password field is never selected, populated, or returned.

---

## Deployment on Render

This API can be deployed on Render as a **Web Service**.

### 1. Database (MongoDB Atlas)

The application reads `MONGODB_URI` from the environment. If you use MongoDB Atlas:

1. Create a free cluster (e.g. `gym_management` database).
2. **Network Access** → Add the current IP, and for Render add `0.0.0.0/0` (or the Render egress IPs) so the deployed service can connect.
3. Copy the connection string (`mongodb+srv://...`) — it will be set in Render's dashboard, never committed to Git.

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Assignment 08 - Gym & Fitness Club Management REST API"
# create the repo itm-assignment-08-gym-api on GitHub, then:
git branch -M main
git remote add origin https://github.com/<your-username>/itm-assignment-08-gym-api.git
git push -u origin main
```

### 3. Create the Web Service on Render

1. Render Dashboard → **New** → **Web Service** → connect the `itm-assignment-08-gym-api` repo.
2. Auto-detected settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Environment variables (all required):
   - `MONGODB_URI` → your Atlas connection string
   - `SESSION_SECRET` → a long random string
   - `CLIENT_ORIGIN` → comma-separated allowed browser origins (optional if you only use Postman)
4. Deploy. MongoDB must allow connections from the Render IPs.

A `render.yaml` blueprint is included for infrastructure-as-code deploys (secrets are `sync: false` and must be filled in the dashboard).

### 4. Verify

```
GET https://<your-service>.onrender.com/api/health
```

Then import `Gym-Fitness-API.postman_collection.json` in Postman, set `baseUrl` to the Render URL, and run the requests. Session cookies are handled automatically, so protected endpoints work after login.

---

## Postman

A ready-to-use collection is included: `Gym-Fitness-API.postman_collection.json`.

1. Open Postman → **Import** → choose the file.
2. Set an environment variable `baseUrl = http://localhost:3000` (the collection already references `{{baseUrl}}`).
3. Requests run in order: register → login → me → create class → list classes → get class → book → cancel → renew → expired → logout.
4. Session cookies are handled automatically, so protected endpoints work after login — **no JWT used**.

---

## Required Grading Scenarios

1. **Registration** — `fit_sam` with `durationMonths: 1` yields `membershipExpiryDate` exactly **30 days** in the future.
2. **Capacity test** — a class with `maxCapacity: 2` allows members 1 and 2 to book; member 3 receives `400 Class capacity reached`.
3. **Expired membership** — a member with a past expiry appears in `GET /api/members/expired` and cannot book (`400 Membership has expired`).
4. **Renewal** — `PATCH /api/members/:id/renew` with `{ additionalMonths: 6, tier: "Platinum" }` extends the expiry, upgrades the tier, and sets status to `active`.
5. **Authentication** — unauthenticated access to `/api/auth/me` and booking returns `401`; after login `200`; after logout `401` again.