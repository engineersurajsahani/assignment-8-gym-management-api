require("dotenv").config({ quiet: true, path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const User = require("./models/User");

const username = process.argv[2];

if (!username) {
  console.log("usage: npm run make-admin -- <username>");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGOOSE_URI)
  .then(() => User.findOneAndUpdate({ username }, { role: "admin" }, { returnDocument: "after" }))
  .then((user) => {
    console.log(user ? `${user.username} is now an admin` : `no user named ${username}`);
  })
  .catch((error) => console.log(error.message))
  .finally(() => mongoose.disconnect());
