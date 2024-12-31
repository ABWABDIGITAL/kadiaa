const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/userModel");
const Lawyer = require("../models/lawyerModel");

// Common function to find or create a user or lawyer
const findOrCreateUserOrLawyer = async (profile, platform) => {
  let user = await User.findOne({ [`${platform}Id`]: profile.id });
  if (!user) {
    let lawyer = await Lawyer.findOne({ [`${platform}Id`]: profile.id });
    if (!lawyer) {
      const newUser = {
        [`${platform}Id`]: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
        profileImage: profile.photos[0].value,
      };
      return platform === 'google' ? await User.create(newUser) : await Lawyer.create(newUser);
    }
    return lawyer;
  }
  return user;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/v1/auth/auth/google/callback",
      scope: ['openid', 'profile', 'email'] 
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userOrLawyer = await findOrCreateUserOrLawyer(profile, 'google');
        return done(null, userOrLawyer);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);


passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:5000/api/v1/auth/facebook/callback",
      profileFields: ['id', 'displayName', 'emails', 'photos'] // Ensure 'emails' field is requested
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Facebook profile:', profile);

        const facebookId = profile.id;
        const displayName = profile.displayName || 'No Display Name';
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : 'No Email';
        const profileImage = profile.photos && profile.photos[0] ? profile.photos[0].value : 'No Profile Image';

        console.log('facebookId:', facebookId);
        console.log('displayName:', displayName);
        console.log('email:', email);
        console.log('profileImage:', profileImage);

        const userOrLawyer = await findOrCreateUserOrLawyer(profile, 'facebook');
        return done(null, userOrLawyer);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await User.findById(id);
    if (!user) {
      user = await Lawyer.findById(id);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
