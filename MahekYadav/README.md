# 🏋️ Gym & Fitness Club Management REST API

Backend assignment built with Node.js, Express.js, MongoDB, Mongoose, Passport.js Local Strategy and Express Session.

# Live link:-
https://itm-assignment-08-gym-api.onrender.com

## Features

- Member registration with membership plan and automatic expiry calculation
- Bcrypt password hashing
- Passport Local Strategy authentication
- Session-based login
- Authenticated member profile
- Upcoming fitness classes
- Trainer filtering
- Class creation
- Class booking and cancellation
- Class capacity validation
- Membership renewal
- Expired membership listing
- Mongoose references and populate

## Project structure

```text
MahekYadav/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Setup

```bash
npm install
cp .env.example .env
```

Set your MongoDB connection string and session secret in `.env`.

Run:

```bash
npm run dev
```

Server:

```text
http://localhost:5000
```

## Endpoints

### Authentication

- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/logout`

### Classes

- GET `/api/classes`
- GET `/api/classes/:id`
- POST `/api/classes`
- POST `/api/classes/:id/book`
- DELETE `/api/classes/:id/cancel`

### Membership

- PATCH `/api/members/:id/renew`
- GET `/api/members/expired`

## Important testing note

The assignment defines one membership month as 30 days. Therefore, `durationMonths: 1` adds exactly 30 days to the current date.

For session authentication in Postman, send the login request first and keep the returned session cookie. Then use the same Postman session/cookie for `/api/auth/me`, booking and cancellation.

## Example registration

```json
{
  "username": "fit_mahek",
  "email": "mahek@example.com",
  "password": "mypassword",
  "membershipTier": "Gold",
  "durationMonths": 3,
  "emergencyContact": "9999999999"
}
```

## Example class

```json
{
  "title": "Zumba Cardio",
  "trainerName": "Maria",
  "scheduleDate": "2026-12-15T09:00:00Z",
  "durationMinutes": 60,
  "maxCapacity": 20
}
```

## Example renewal

```json
{
  "additionalMonths": 6,
  "tier": "Platinum"
}
```
