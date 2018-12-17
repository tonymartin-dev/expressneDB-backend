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
var app = express();

/**
 * AUTHENTICATION
 */
passport.use(new LocalStrategy(     // configure passport.js to use the local strategy
    { usernameField: 'username' },
    (username, password, done) => {
        
        console.log('\nInside local strategy callback');

        getUser(username, (err, user)=>{

            if(err)
                return done(err);        
            if(!user)
                //return res.send('You were authenticated & logged in!\n');
                return done(null, false, { message: 'Invalid credentials. (USERNAME)\n' });

            if (username === user.username && password === user.password) {
                console.log('Local strategy returned true')
                return done(null, user)
            } else {
                return done(null, false, { message: 'Invalid credentials.\n' });
            }
        })
    
}));

/**
 * SESSION MANAGEMENT
 */

 //Save Session
 passport.serializeUser((user, done) => {
    let serializeData = {username: user.username, token: generateToken()};
    console.log('\nSERIALIZING: ', serializeData);
    done(null, serializeData);
});

//Restore session
passport.deserializeUser((sessionData, done) => {
    console.log('\nDESERIALIZING: ', {username: sessionData.username, token: sessionData.token});
    
    getUser(sessionData.username, (err, user)=>{
        if(err){
            done(null, false);
        }else{
            done(null, {user: user, token: sessionData.token});
        }
    })
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
};

function generateToken() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
