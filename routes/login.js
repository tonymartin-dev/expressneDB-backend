/**
 * TUTORIAL
 * https://medium.com/@evangow/server-authentication-basics-express-sessions-passport-and-curl-359b7456003d
 */
var passport        = require('passport')
var express         = require('express');
var uuid            = require('uuid/v4');
var session         = require('express-session');
const FileStore     = require('session-file-store')(session);
var LocalStrategy   = require('passport-local').Strategy;
var session         = require("express-session");
var Datastore       = require('nedb');
var db              = new Datastore({filename: 'db/clients.db'});
db.loadDatabase();
//Router
var router  = express.Router();

/**
 * Authentication
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
        })
    
}));

/**
 * SESSION MANAGEMENT
 */

 //Save Session
passport.serializeUser((user, done) => {
    let sessionToken = generateToken();
    console.log('\nInside serializeUser callback.');
    console.log('   GENERATING SESSION. Username is save to the session file: ', user.username);
    console.log('                       Token is save to the session file: ', sessionToken);
    done(null, {username: user.username, token: sessionToken});
});

//Restore session
passport.deserializeUser((sessionData, done) => {
    console.log('\nInside deserializeUser callback')
    console.log(`   RECOVERING SESSION. The username passport saved in the session file store is: ${sessionData.username}`);
    console.log(`                       The token passport saved in the session file store is: ${sessionData.token}`);
    
    getUser(sessionData.username, (err, user)=>{
        if(err){
            done(null, false);
        }else{
            done(null, {user: user, token: sessionData.token});
            //done(null, false);
        }
    })
    //const user = users[0].username === username ? users[0] : false; 
});

//Manage session
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

/**
 * METHODS
 */
router.get('/', (req, res) => {
    console.log('\nInside the homepage callback function')
    console.log('   Session ID', req.sessionID)
    res.send(`You hit home page!\n`)
})

router.post('/', (req, res, next) => {
    console.log('\nInside POST /login callback function')
    console.log('TOKEN', req.token);
    passport.authenticate('local', (err, user, info) => {
        console.log('\nInside passport.authenticate() callback');
        console.log(`   req.user:               ${JSON.stringify(req.user)}`);
        console.log(`   req.session.passport:   ${JSON.stringify(req.session.passport)}`);
        console.log(`   Received info:          ${JSON.stringify(info)}`);
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
                userData = {}
                for (const key in user) {
                    if(key != 'password')
                        userData[key] = user[key];                        
                }
                return res.send({status: 'LOGIN SUCCESS', userData: userData});
            }
        })
    })(req, res, next);
});

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

function generateToken() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};


module.exports = router;
