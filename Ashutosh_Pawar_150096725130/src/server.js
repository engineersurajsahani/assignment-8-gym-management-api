require("dotenv").config({ quiet: true });

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());

app.get("/", (request, response) => {
  response.status(200).json({ message: "connected" });
});

app.use("/api/auth", authRoutes);

app.use((request, response) => {
  response.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}!!`);
  });
});
