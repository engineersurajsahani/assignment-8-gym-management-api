require("dotenv").config({ quiet: true });

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
require("./config/passport");
const classRoutes = require("./routes/classRoutes");
const memberRoutes = require("./routes/memberRoutes");
const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (request, response) => {
  response.status(200).json({ message: "connected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/members", memberRoutes);

app.use((request, response) => {
  response.status(404).json({ message: "Route not found" });
});

app.use((err, request, response, next) => {
  console.error(err);
  response.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}!!`);
  });
});
