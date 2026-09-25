const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

passport.use(
  new LocalStrategy(async (email, password, done) => {
    try {
      const user = await User.findOne({ $or: [{ username: email }, { email: email }] });
      if (!user) {
        return done(null, false, { message: "Invalid credentials!" });
      }

      const isPassValid = await bcrypt.compare(password, user.password);
      if (!isPassValid) {
        return done(null, false, { message: "Invalid credentials!" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
