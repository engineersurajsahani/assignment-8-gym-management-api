# 🏋️ Gym & Fitness Club Management REST API

A backend REST API for managing gym memberships, fitness classes, member bookings, membership expiry, renewals, and authentication. Built using **Node.js, Express.js, MongoDB, Mongoose, Passport.js, Express Session, and bcryptjs**.

---

## 👩‍💻 Author

**Name:** Jui Tawde  
**Cohort:** Sam Altman  
**Project:** Assignment 08 – Gym & Fitness Club Management REST API

---

## 🚀 Live Deployment

**Live API:** https://gym-management-api-tzg1.onrender.com

---

## 📌 Project Overview

This project implements a complete backend REST API for a Gym & Fitness Club Management System.

The API allows gym members to register and log in, manage their memberships, check membership expiry, renew memberships, view fitness classes, book classes, cancel bookings, and manage class capacity.

Authentication is implemented using **Passport.js Local Strategy** and **Express Session**, while passwords are securely hashed using **bcryptjs**.

---

## ✨ Features

- 👤 Member registration and login
- 🔐 Passport.js Local Strategy authentication
- 🍪 Session-based authentication using Express Session
- 🔒 Password hashing using bcryptjs
- 💳 Membership tiers:
  - Bronze
  - Silver
  - Gold
  - Platinum
- 📅 Automatic membership expiry calculation
- ⏳ Membership status tracking
- 🔄 Membership renewal
- 🏋️ Fitness class management
- 👨‍🏫 Trainer information
- 👥 Class capacity management
- 🎟️ Class booking and cancellation
- 🚫 Prevents expired members from booking classes
- 🚫 Prevents duplicate class bookings
- 🚫 Prevents bookings when class capacity is full
- 🔎 Filter classes by trainer
- 📊 View enrolled members
- 📋 View expired members
- 🌐 CORS support
- ⚠️ Error and 404 handling
- ☁️ MongoDB Atlas integration
- 🚀 Render deployment

---

## 🛠️ Technologies Used

- **Node.js** – JavaScript runtime
- **Express.js** – REST API framework
- **MongoDB** – Database
- **Mongoose** – MongoDB ODM
- **Passport.js** – Authentication
- **Passport Local Strategy** – Username/password authentication
- **Express Session** – Session management
- **bcryptjs** – Password hashing
- **dotenv** – Environment variables
- **cors** – Cross-Origin Resource Sharing
- **Render** – Deployment

---

## 📁 Project Structure

    assignment-08-gym-api/
    │
    ├── config/
    │   ├── db.js
    │   └── passport.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── classController.js
    │   └── memberController.js
    │
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── checkActiveMember.js
    │
    ├── models/
    │   ├── FitnessClass.js
    │   └── User.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── classRoutes.js
    │   └── memberRoutes.js
    │
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── server.js
    └── README.md

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

    git clone https://github.com/YOUR_USERNAME/itm-assignment-08-gym-api.git
    cd itm-assignment-08-gym-api

### 2. Install Dependencies

    npm install

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

    PORT=3000
    MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/gym_management?retryWrites=true&w=majority
    SESSION_SECRET=your_secret_key

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Port on which the server runs |
| `MONGO_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Secret used for securing sessions |

> ⚠️ Never commit the `.env` file to GitHub.

### 4. Run the Application

Development:

    npm run dev

Production:

    npm start

The API will run locally at:

    http://localhost:3000

---

## 🔐 Authentication

The API uses **Passport.js Local Strategy** with **Express Session** for authentication.

Users can register using:

- Username
- Email
- Password
- Membership Tier
- Membership Duration

Passwords are securely hashed using **bcryptjs** before being stored in MongoDB.

After successful login, Passport creates an authenticated session that can be used to access protected endpoints.

---

## 📌 API Endpoints

### 👤 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new member |
| POST | `/api/auth/login` | Login member |
| GET | `/api/auth/me` | Get authenticated member profile |
| POST | `/api/auth/logout` | Logout member |

### Register

**POST**

    /api/auth/register

Request body:

    {
      "username": "jui123",
      "email": "jui@example.com",
      "password": "password123",
      "membershipTier": "Gold",
      "durationMonths": 1
    }

### Login

**POST**

    /api/auth/login

Request body:

    {
      "username": "jui123",
      "password": "password123"
    }

A successful login creates an authenticated session.

### Get Current Member

**GET**

    /api/auth/me

Returns the authenticated member's profile and remaining membership days.

### Logout

**POST**

    /api/auth/logout

Logs out the authenticated member and destroys the session.

---

## 🏋️ Fitness Class Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | Get upcoming classes |
| GET | `/api/classes?trainer=John` | Filter classes by trainer |
| GET | `/api/classes/:id` | Get class details and enrolled members |
| POST | `/api/classes` | Create a fitness class |
| POST | `/api/classes/:id/book` | Book a fitness class |
| DELETE | `/api/classes/:id/cancel` | Cancel a booking |

### Create a Fitness Class

**POST**

    /api/classes

Request body:

    {
      "title": "Morning Yoga",
      "trainerName": "John",
      "scheduleDate": "2026-09-15T08:00:00.000Z",
      "durationMinutes": 60,
      "maxCapacity": 20
    }

### Filter Classes by Trainer

**GET**

    /api/classes?trainer=John

### Get Class Details

**GET**

    /api/classes/:id

Returns class information along with enrolled members.

### Book a Class

**POST**

    /api/classes/:id/book

A member must be authenticated and have an active membership.

Booking validation includes:

- Member must be logged in
- Membership must be active
- Member cannot book the same class twice
- Class cannot exceed maximum capacity
- Expired members cannot book classes

Example response when the class is full:

    {
      "message": "Class capacity reached"
    }

### Cancel Booking

**DELETE**

    /api/classes/:id/cancel

Cancels the authenticated member's booking.

---

## 💳 Membership Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/members/:id/renew` | Renew membership |
| GET | `/api/members/expired` | Get expired members |

### Renew Membership

**PATCH**

    /api/members/:id/renew

Request body:

    {
      "additionalMonths": 3,
      "tier": "Platinum"
    }

The membership expiry date is extended according to the additional months.

### Get Expired Members

**GET**

    /api/members/expired

Returns members whose membership has expired.

---

## 📊 Membership Tiers

The API supports four membership tiers:

- Bronze
- Silver
- Gold
- Platinum

Membership statuses:

- Active
- Expired
- Frozen

---

## 🗄️ Database Models

### User Model

The User model contains:

- Username
- Email
- Password
- Membership Tier
- Membership Status
- Membership Expiry Date
- Emergency Contact
- Membership Duration
- Timestamps

### FitnessClass Model

The FitnessClass model contains:

- Class Title
- Trainer Name
- Schedule Date
- Duration
- Maximum Capacity
- Enrolled Members
- Timestamps

Fitness classes reference enrolled users using MongoDB ObjectIds and Mongoose relationships.

---

## ⏳ Membership Expiry

Membership expiry is automatically calculated according to the selected membership duration.

Example:

    1 Month Membership
            ↓
    Membership Starts
            ↓
    Expiry Date Calculated
            ↓
    Member Can Book Classes
            ↓
    Membership Expires
            ↓
    Member Cannot Book Classes

The `/api/auth/me` endpoint also provides the remaining membership days.

---

## 🧪 Testing

The API can be tested using:

- Postman
- Thunder Client
- REST Client
- Browser for GET endpoints

### Recommended Testing Flow

    1. Register a member
            ↓
    2. Login
            ↓
    3. Check /api/auth/me
            ↓
    4. Create a fitness class
            ↓
    5. Book the class
            ↓
    6. View class details
            ↓
    7. Cancel booking
            ↓
    8. Renew membership
            ↓
    9. Check expired members
            ↓
    10. Logout

---

## 🚀 Deployment

The API is deployed using **Render** and uses **MongoDB Atlas** as the production database.

### Live API

https://gym-management-api-tzg1.onrender.com

### Production Architecture

    Render
       ↓
    Node.js + Express.js
       ↓
    Passport.js + Express Session
       ↓
    MongoDB Atlas

Environment variables such as `MONGO_URI` and `SESSION_SECRET` are configured through Render's Environment settings.

---

## 🔒 Security

The application implements the following security practices:

- Passwords are hashed using bcryptjs
- Passport.js handles authentication
- Express Session manages authenticated sessions
- Sensitive environment variables are stored in `.env`
- `.env` is excluded from Git using `.gitignore`
- Protected routes require authentication
- Expired members cannot book classes
- Duplicate bookings are prevented
- Class capacity is validated before booking

---

## ⚠️ Error Handling

The API handles common errors using appropriate HTTP status codes:

- **400** – Bad Request
- **401** – Unauthorized
- **404** – Not Found
- **500** – Internal Server Error

Example:

    {
      "message": "Class capacity reached"
    }

---

## 🎯 Assignment Requirements Covered

| Requirement | Status |
|------------|--------|
| Mongoose schemas | ✅ |
| MongoDB relationships | ✅ |
| Date handling | ✅ |
| Membership expiry | ✅ |
| Membership renewal | ✅ |
| Passport Local Strategy | ✅ |
| Express Session | ✅ |
| bcrypt password hashing | ✅ |
| Fitness class CRUD | ✅ |
| Class capacity validation | ✅ |
| Class booking | ✅ |
| Booking cancellation | ✅ |
| Active member validation | ✅ |
| Expired member listing | ✅ |
| Controllers | ✅ |
| Routes | ✅ |
| Middleware | ✅ |
| Error handling | ✅ |
| MongoDB Atlas | ✅ |
| Render deployment | ✅ |

---

## ⭐ Project Summary

**Gym & Fitness Club Management REST API**

A complete backend REST API demonstrating authentication, session management, MongoDB database integration, membership lifecycle management, fitness class management, class booking, capacity validation, and deployment using Render.

### Built With

**Node.js • Express.js • MongoDB • Mongoose • Passport.js • Express Session • bcryptjs**
