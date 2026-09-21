const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://2025rishit_db_user:tR7xxfk9nNtBDGFi@gym.mn021hp.mongodb.net/gymmgmt?retryWrites=true&w=majority&appName=gym";

mongoose.connect(MONGO_URI);

const db = mongoose.connection;

db.on("connected", () => {
    console.log("Database connected successfully");
});

db.on("disconnected", () => {
    console.log("Database disconnected");
});

db.on("error", (error) => {
    console.log("Database connection error: ", error);
});

module.exports = db;
