# 🏋️‍♂️ Gym & Fitness Club Management API

A RESTful **Gym & Fitness Club Management API** built using **Node.js, Express.js, MongoDB, Mongoose, Passport.js, Express-Session, and bcryptjs**.

## 🚀 Live Deployment

[**https://assignment-8-gym-management-api-4p01.onrender.com**](https://assignment-8-gym-management-api-4p01.onrender.com)

## 🛠️ Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* Passport.js
* Express-Session
* bcryptjs
* dotenv

## ✨ Features

* Member registration and login
* Session-based authentication
* Membership plans and expiry tracking
* Membership renewal
* Fitness class management
* Class booking and cancellation
* Class capacity validation
* Expired membership tracking
* Mongoose schema relationships and validation

## 📌 Main API Routes

| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/api/auth/register`      | Register a new member    |
| POST   | `/api/auth/login`         | Login                    |
| GET    | `/api/auth/me`            | Get member profile       |
| GET    | `/api/classes`            | View upcoming classes    |
| GET    | `/api/classes/:id`        | View class details       |
| POST   | `/api/classes`            | Create a fitness class   |
| POST   | `/api/classes/:id/book`   | Book a class             |
| DELETE | `/api/classes/:id/cancel` | Cancel a booking         |
| PATCH  | `/api/members/:id/renew`  | Renew membership         |
| GET    | `/api/members/expired`    | View expired memberships |

## 🗄️ Database

The API uses **MongoDB with Mongoose** for persistent data storage.

Main models:

* `User`
* `FitnessClass`

## 👨‍💻 Assignment

**Assignment 08 – Gym & Fitness Club Management API**

Backend Development Assignment.
