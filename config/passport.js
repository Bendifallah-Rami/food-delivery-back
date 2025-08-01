const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { User } = require('../models');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (user) {
            // User exists, return user
            return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ where: { email: profile.emails[0].value } });

        if (user) {
            // User exists with same email, link Google account
            user = await user.update({
                googleId: profile.id,
                provider: 'google',
                isOAuthUser: true,
                avatar: profile.photos[0].value,
                emailVerified: true // Google emails are pre-verified
            });
            return done(null, user);
        }

        // Create new user
        user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            avatar: profile.photos[0].value,
            provider: 'google',
            isOAuthUser: true,
            emailVerified: true,
            isActive: true,
            role: 'customer'
        });

        return done(null, user);
    } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
    }
}));

// JWT Strategy for API routes
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['token'];
    }
    return token;
};

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor
    ]),
    secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
    try {
        const user = await User.findByPk(payload.userId, {
            attributes: { exclude: ['password'] }
        });
        
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
