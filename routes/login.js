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

// configure passport.js to use the local strategy
passport.use(new LocalStrategy( 
    { usernameField: 'username' },
    (username, password, done) => {
    console.log('\nInside local strategy callback');

    getUser(username, (err, user)=>{

        if(err)
            return done(err, false, { message: 'Error consulting DB \n' });
        
        if(!user)
            //return res.send('You were authenticated & logged in!\n');
            return done({ message: 'Invalid credentials. (USERNAME)\n' }, false, { message: 'Invalid credentials. (USERNAME)\n' });

        if (username === user.username && password === user.password) {
            console.log('Local strategy returned true')
            return done(null, user)
        } else {
            return done(true, false, { message: 'Invalid credentials.\n' });
        }
    })
    
}));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
    console.log('\nInside serializeUser callback.');
    console.log('   GENERATING SESSION. User id is save to the session file: ', user.username);
    done(null, user.username);
});
passport.deserializeUser((username, done) => {
    console.log('\nInside deserializeUser callback')
    console.log(`   RECOVERING SESSION. The username passport saved in the session file store is: ${username}`)
    getUser(username, (err, user)=>{
        if(err){
            done(null, false);
        }else{
            done(null, user);
            //done(null, false);
        }
    })
    //const user = users[0].username === username ? users[0] : false; 
});
//Router
var router  = express.Router();

// add & configure middleware
router.use(session({
    genid: (req) => {
        console.log('\n PASSPORT INIT \n')
        console.log('\nInside the session middleware')
        console.log('   Session ID',req.sessionID)
        return uuid() // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
router.use(passport.initialize());
router.use(passport.session());

//Methods
router.get('/', (req, res) => {
    console.log('\nInside the homepage callback function')
    console.log('   Session ID', req.sessionID)
    res.send(`You hit home page!\n`)
})

router.post('/', (req, res, next) => {
    console.log('\nInside POST /login callback function')
    passport.authenticate('local', (err, user, info) => {
        console.log('\nInside passport.authenticate() callback');
        console.log(`   req.session.passport: ${JSON.stringify(req.session.passport)}`);
        console.log(`   req.user: ${JSON.stringify(req.user)}`);
        if(err){
            return next(err);
        }
        req.login(user, (err) => {
            if(err){
                return next(err);
            }else{
                console.log('\nInside req.login() callback')
                console.log(`   req.session.passport: ${JSON.stringify(req.session.passport)}`)
                console.log(`   req.user: ${JSON.stringify(req.user)}`)
                return res.send('You were authenticated & logged in!\n');
            }
        })
    })(req, res, next);
})

module.exports = router;
