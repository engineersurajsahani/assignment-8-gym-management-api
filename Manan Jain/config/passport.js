const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../model/User");

/**
 * Configure Passport Local Strategy for Authentication
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password"
    },
    async (username, password, done) => {
      try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Validate password with bcrypt compare method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Authentication successful
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/**
 * Serialize User - store user id in the session
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize User - retrieve user details from MongoDB using session id
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
