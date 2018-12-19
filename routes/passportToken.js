/**
 * TUTORIAL
 * https://medium.com/front-end-hacking/learn-using-jwt-with-passport-authentication-9761539c4314
 */
var passport      = require('passport')
var LocalStrategy = require('passport-local').Strategy;

const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

var Datastore = require('nedb');
var db = new Datastore({filename: 'db/clients.db'});
db.loadDatabase();
//Router

/**
 * AUTHENTICATION
 */
passport.use(new LocalStrategy(     // configure passport.js to use the local strategy
    { usernameField: 'username' },
    (username, password, done) => {
        
        console.log('\nInside local strategy callback');

        getUser(username, (err, user)=>{

            if(err)
                return done(err, false, { message: 'Error consulting DB \n' });        
            if(!user)
                //return res.send('You were authenticated & logged in!\n');
                return done({ message: 'Invalid credentials. (USERNAME)\n' }, false);

            if (username === user.username && password === user.password) {
                console.log('Local strategy returned true')
                return done(null, user, 'mimimi')
            } else {
                return done({ message: 'Invalid credentials.\n' }, false);
            }
        });
    
}));

/**
 * TOKEN AUTH
 */

passport.use(new JWTStrategy(
    {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey   : 'react_blog_project'
    },
    function (jwtPayload, done) {

        console.log('Authenticating using token');

        getUser(jwtPayload.username, (err, user)=>{

            if(err)
                return done(err, false, { message: 'Error consulting DB \n' });        
            if(!user)
                //return res.send('You were authenticated & logged in!\n');
                return done({ message: 'Invalid credentials. (USERNAME)\n' }, false);

            if (jwtPayload.username === user.username && jwtPayload.password === user.password) {
                console.log('Local strategy returned true')
                return done(null, user, 'mimimi')
            } else {
                return done({ message: 'Invalid credentials.\n' }, false);
            }
        });
    }
));

/**
 * UTILITIES
 */



function getUser(username, callback){
    db.find({"username": username}, function(err, response) {
        
        if(err){
            console.log('USER REQUEST ERROR: ', err);
            callback(err, response)
        }else{

            console.log('USER REQUEST SUCCESS: ', response);
            
            user = response[0];

            callback(null, user)

        }

    });
}