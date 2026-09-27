# 🏋️‍♂️ Gym & Fitness Club Management REST API

A full-featured backend API for a Gym & Fitness Center Management System using MongoDB and Mongoose. This project implements persistent membership lifecycle management, class bookings with seat capacity constraints, and user authentication using Passport.js.

## 👨‍🎓 Student Details

**Name:** Harsh Kumar  
**Roll No.:** 150096725105  
**Course:** BTech CSE  
**Assignment:** 8 — Gym & Fitness Club Management REST API  

## ✨ Features

- **Authentication:** Stateful session-based user authentication using Passport.js (Local Strategy).
- **Membership Management:** Persistent membership lifecycle management, calculating plan expiry dates, subscription renewals, and membership status checks.
- **Class Booking:** Class bookings with seat capacity constraints to prevent over-enrollment.
- **Relational Data:** Manages relational links between Members, Fitness Classes, and Trainers using Mongoose references (`populate`).
- **Database Hooks:** Utilizes Mongoose middleware for automatic date calculations.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** Passport.js (Local Strategy), express-session, bcryptjs
- **Utilities:** dotenv, cors

## 📁 Project Structure

```text
Harsh-Assignment-8-Gym-Management-Api/
├── config/
│   ├── db.js                # Mongoose connection
│   └── passport.js          # Passport Local strategy setup
├── controllers/
│   ├── authController.js    # Register with auto-expiry calculation
│   ├── classController.js   # Class CRUD & booking capacity logic
│   └── memberController.js  # Renewal & expired query handlers
├── middleware/
│   ├── authMiddleware.js    # Ensure session authentication
│   └── checkActiveMember.js # Check member is not expired
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
└── server.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- MongoDB installed and running locally, or a MongoDB Atlas URI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/harsh4421/Harsh-Assignment-8-Gym-Management-Api.git
   ```

2. Navigate to the project directory:
   ```bash
   cd Harsh-Assignment-8-Gym-Management-Api
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file based on `.env.example`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/gym-management
   SESSION_SECRET=your_super_secret_session_key
   ```

5. Start the server:
   ```bash
   npm start
   ```

   For development with nodemon:
   ```bash
   npm run dev
   ```

## 📋 API Endpoints

### 🔐 Authentication (Passport-Local)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new member with chosen membership plan |
| `POST` | `/api/auth/login` | Login via Passport Local |
| `GET` | `/api/auth/me` | Fetch active member profile & remaining days |

### 🏋️‍♂️ Fitness Class & Booking

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/classes` | Fetch all upcoming classes (supports `?trainer=John`) |
| `GET` | `/api/classes/:id` | Get class details with enrolled members list |
| `POST` | `/api/classes` | Create a new workout class |
| `POST` | `/api/classes/:id/book` | Enroll logged-in user (Fails if class is full or membership expired) |
| `DELETE` | `/api/classes/:id/cancel` | Cancel member booking from class |

### 💳 Membership Management

| Method | Endpoint | Description |
|---|---|---|
| `PATCH` | `/api/members/:id/renew` | Renew / extend membership expiry date |
| `GET` | `/api/members/expired` | Get list of all expired memberships |
