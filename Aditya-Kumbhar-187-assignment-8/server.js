require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");

const connectDB = require("./config/db");
const passport = require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const classRoutes = require("./routes/classRoutes");
const memberRoutes = require("./routes/memberRoutes");

const app = express();

// connect to mongodb
connectDB();

app.use(cors());
app.use(express.json());

// session needed for passport to keep the user logged in
app.use(
  session({
    secret: process.env.SESSION_SECRET || "gymsecret123",
    resave: false,
    saveUninitialized: false,
  })
);


app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/members", memberRoutes);

app.get("/", (req, res) => {
  res.send("Gym Management API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
