# Gym & Fitness Club Management REST API


Render Link -  https://assignment-8-gym-management-api-lgcp.onrender.com

A complete, beginner-friendly REST API built with Node.js, Express, MongoDB Atlas, and Passport.js (Local Strategy) to manage Gym members, their subscriptions, and fitness class bookings.

## Technologies Used

- **Node.js** & **Express.js** - Server framework
- **MongoDB Atlas** & **Mongoose** - Cloud database & ODM
- **Passport.js** & **passport-local** - Local authentication strategy
- **Express Session** - Session management
- **bcryptjs** - Password hashing
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing

## Folder Structure

```text
gym-fitness-api/
│
├── config/
│   ├── db.js                 # MongoDB Atlas connection
│   └── passport.js           # Passport Local Strategy setup
│
├── middleware/
│   ├── authMiddleware.js     # Ensures user is authenticated via session
│   └── checkActiveMember.js  # Ensures membership is active before booking
│
├── model/
│   ├── User.js               # Member schema with bcrypt pre-save hooks
│   └── FitnessClass.js       # Fitness class schema referencing users
│
├── router/
│   ├── authRouter.js         # Authentication endpoints
│   ├── classRouter.js        # Class management & booking endpoints
│   └── memberRouter.js       # Membership renewal and expiry checks
│
├── .env                      # Local environment variables
├── .env.example              # Sample environment configuration
├── .gitignore                # Ignored files/folders
├── package.json              # App dependencies and scripts
├── server.js                 # Main application entry point
└── README.md                 # Project documentation
```

## Setup Instructions

### 1. MongoDB Atlas Setup

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with a username and password.
3. Allow access from any IP (`0.0.0.0/0`) or whitelist your IP address.
4. Copy the connection string (URI).

### 2. Installation

1. Clone or download this project.
2. Install the required dependencies:

```bash
npm install
```

### 3. Environment Variable Setup

1. Copy `.env.example` to a new `.env` file:
   
```bash
cp .env.example .env
```

2. Open the `.env` file and fill in your variables:

```env
PORT=3000
MONGO_URI=your_mongodb_atlas_connection_string
SESSION_SECRET=your_secret_session_key
NODE_ENV=development
```

### 4. Running the Project

Start the application in development mode (using nodemon):

```bash
npm run dev
```

Or start normally using node:

```bash
npm start
```

## API Endpoint Documentation

### Authentication (`/api/auth`)

| Method | Endpoint             | Description                           | Access  |
|--------|----------------------|---------------------------------------|---------|
| POST   | `/api/auth/register` | Register a new member                 | Public  |
| POST   | `/api/auth/login`    | Login a member via Passport           | Public  |
| POST   | `/api/auth/logout`   | Logout and destroy session            | Private |
| GET    | `/api/auth/me`       | Get the current logged-in user profile| Private |

### Fitness Classes (`/api/classes`)

| Method | Endpoint                 | Description                                      | Access  |
|--------|--------------------------|--------------------------------------------------|---------|
| GET    | `/api/classes`           | List upcoming classes (supports `?trainer=Name`) | Public  |
| GET    | `/api/classes/:id`       | Get single class details                         | Public  |
| POST   | `/api/classes`           | Create a new class                               | Public  |
| POST   | `/api/classes/:id/book`  | Book a class (Requires Active Membership)        | Private |
| DELETE | `/api/classes/:id/cancel`| Cancel a class booking                           | Private |

### Membership (`/api/members`)

| Method | Endpoint                  | Description                               | Access |
|--------|---------------------------|-------------------------------------------|--------|
| PATCH  | `/api/members/:id/renew`  | Renew or upgrade an existing membership   | Public |
| GET    | `/api/members/expired`    | List members whose subscriptions expired  | Public |

## Testing Instructions

Use Postman or cURL to interact with the endpoints.

1. **Register**: Send a `POST` request to `/api/auth/register` with `username`, `email`, `password`, and `durationMonths`.
2. **Login**: Send a `POST` request to `/api/auth/login` with your `username` and `password`. Express Session will establish a cookie. Make sure your HTTP client sends this cookie with subsequent requests.
3. **Book Class**: Create a class via `POST /api/classes`, then test booking via `POST /api/classes/:id/book`. Ensure only active members can book.
4. **Renewal**: Test `PATCH /api/members/:id/renew` to verify the expiry logic correctly handles both active and expired extensions.
