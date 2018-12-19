/**
 * TUTORIAL: https://scotch.io/@devGson/api-authentication-with-json-web-tokensjwt-and-passport
 */

const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;

//Database
var Datastore = require('nedb');
var db = new Datastore({filename: 'db/users.db', autoload: true});

/**
 *  Passport middleware to handle user registration
 */
passport.use('signup', new localStrategy({
    usernameField : 'username',
    passwordField : 'password'
}, async (username, password, done) => {
    //Save the information provided by the user to the the database
    db.insert({ username, password }, function(err, user) {
        if(err) done(err);
        //Send the user information to the next middleware
        else    done(null, user);
    });
    
}));

/**
 * Passport middleware to handle User login
 **/
passport.use('login', new localStrategy({
  usernameField : 'username',
  passwordField : 'password'
}, async (username, password, done) => {

    //Find the user associated with the username provided
    db.find({username: username}, function(err, users){
        
        if(err) done(err);

        var user = users[0];
        
        //If the user isn't found in the database, return a message
        if( !user ) return done(null, false, { message : 'User not found'});
    
        db.find({password: password}, function(err, users){

            //If the passwords match, it returns a value of true.
            if( !user ) return done(null, false, { message : 'Wrong Password'});
            
            //Send the user information to the next middleware
            return done(null, user, { message : 'Logged in Successfully'});

        });


    })
  
}));

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