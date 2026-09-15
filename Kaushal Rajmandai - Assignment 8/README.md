# Assignment 8: Gym & Fitness Club Management REST API

**Author:** Kaushal Dinesh Rajmandai | **Roll No:** 150096725111

## Tech Stack
Node.js, Express.js, MongoDB, Mongoose, Passport.js (Local Strategy), Express-Session, bcryptjs, dotenv, cors

## Features
- Member registration with automatic membership expiry calculation
- Passport.js session-based authentication (register, login, profile)
- Fitness class CRUD with trainer filtering
- Class booking with capacity limits and membership status checks
- Membership renewal and expired-member lookup

## Project Structure
All source files are organized under `config/`, `controllers/`, `middleware/`, `models/`, and `routes/`, with `server.js` as the entry point.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `MONGODB_URI`, `SESSION_SECRET`, `PORT`
3. `npm run dev`

## API Endpoints
See assignment spec for full endpoint list — auth (`/api/auth`), classes (`/api/classes`), and membership (`/api/members`) routes.