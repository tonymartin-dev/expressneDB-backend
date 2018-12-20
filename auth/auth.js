/**
 * TUTORIAL: https://scotch.io/@devGson/api-authentication-with-json-web-tokensjwt-and-passport
 */

const passport = require('passport');
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

/**
 * Passport midelware to handle secure requests (called when inserted middleware: passport.authenticate('jwt', { session : false }))
 */
passport.use('jwt', new JWTstrategy({
    secretOrKey: 'top_secret',                                  //secret we used to sign our JWT in login.js
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()    //we expect the user to send the token as a Bearer auth header
}, async (jwtPayload, done) => {
    try {
        //Pass the user details to the next middleware
        return done(null, jwtPayload.user);
    } catch (error) {
        done(error);
    }
}));