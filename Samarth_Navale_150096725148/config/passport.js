const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

passport.use(
  new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
      try {
        const usr = await User.findOne({
          $or: [{ username: username }, { email: username.toLowerCase() }]
        });

        if (!usr) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, usr.password);
        if (!match) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, usr);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const usr = await User.findById(id).select('-password');
    done(null, usr);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
