const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const User = require('../models/User');

// ------------------------------------------------------------------
// Passport Local Strategy
// Authentication is based on username + password.
// ------------------------------------------------------------------
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },
    async (username, password, done) => {
      try {
        // 1. Find the user by username.
        const user = await User.findOne({ username });

        // 2. If the user does not exist, authentication fails.
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        // 3. Compare the supplied password with the stored hash.
        const isMatch = await bcrypt.compare(password, user.password);

        // 4. If the password is incorrect, authentication fails.
        if (!isMatch) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        // 5. Password is correct -> authentication succeeds.
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ------------------------------------------------------------------
// Session serialization
// Only the MongoDB _id is stored inside the session cookie.
// ------------------------------------------------------------------
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ------------------------------------------------------------------
// Session deserialization
// On every request Passport rebuilds the user object by _id.
// ------------------------------------------------------------------
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;