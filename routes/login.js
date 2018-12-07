/**
 * TUTORIAL
 * https://medium.com/@evangow/server-authentication-basics-express-sessions-passport-and-curl-359b7456003d
 */

var passport    = require('passport')
var express     = require('express');
var uuid        = require('uuid/v4');
var session     = require('express-session');
const FileStore = require('session-file-store')(session);
var passport      = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var session = require("express-session");
var Datastore = require('nedb');
var db = new Datastore({filename: 'db/auth.db'});
db.loadDatabase();

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
    { usernameField: 'username' },
    (username, password, done) => {
        console.log('Inside local strategy callback')
        // here is where you make a call to the database
        // to find the user based on their username or email address
        // for now, we'll just pretend we found that it was users[0]
        var user;
        db.find({"username": username}, function(err, items) {
            console.log('ITEMS: ', items);
            user = items[0];
            //const user = users[0]
            if (username === user.username && password === user.password) {
                console.log('Local strategy returned true')
                return done(null, user)
            }
        });
    }
));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback. User id is save to the session file store here')
    done(null, user.id);
});

//Router
var router  = express.Router();

// add & configure middleware
router.use(session({
    genid: (req) => {
      console.log('Inside the session middleware')
      console.log(req.sessionID)
      return uuid() // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
  
//Methods
router.get('/', (req, res) => {
    console.log('Inside the homepage callback function')
    console.log(req.sessionID)
    res.send(`You hit home page!\n`)
})

router.post('/', (req, res, next) => {
    console.log('Inside POST /login callback function')
    passport.authenticate('local', (err, user, info) => {
        console.log('Inside passport.authenticate() callback');
        console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
        console.log(`req.user: ${JSON.stringify(req.user)}`)
        req.login(user, (err) => {
            console.log('Inside req.login() callback')
            console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
            console.log(`req.user: ${JSON.stringify(req.user)}`)
            return res.send('You were authenticated & logged in!\n');
        })
    })(req, res, next);
})

module.exports = router;
