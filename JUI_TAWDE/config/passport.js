const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username });

        if (!user) {
          return done(null, false, {
            message: 'Invalid username or password',
          });
        }

        const isPasswordCorrect =
          await user.comparePassword(password);

        if (!isPasswordCorrect) {
          return done(null, false, {
            message: 'Invalid username or password',
          });
        }

        // Update expired status when the user logs in
        if (
          user.membershipExpiryDate &&
          user.membershipExpiryDate < new Date() &&
          user.membershipStatus === 'active'
        ) {
          user.membershipStatus = 'expired';
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/*
  Store user ID in session.
*/
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

/*
  Retrieve user from MongoDB using session ID.
*/
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;