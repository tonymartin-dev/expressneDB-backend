/**
 * TUTORIAL
 * https://medium.com/@evangow/server-authentication-basics-express-sessions-passport-and-curl-359b7456003d
 */
var passport        = require('passport')
var express         = require('express');
var Datastore       = require('nedb');
var db              = new Datastore({filename: 'db/clients.db'});
db.loadDatabase();
//Router
var router  = express.Router();


/**
 * METHODS
 */
router.get('/', (req, res) => {
    console.log('\nInside the homepage callback function')
    console.log('   Session ID', req.sessionID)
    res.send(`You hit home page!\n`)
})

router.post('/', (req, res, next) => {
    console.log('\nInside POST /login callback function. TOKEN: ', req.token)
    passport.authenticate('local', { successRedirect: '/player', failureRedirect: '/' }, (err, user, info) => {
        console.log('\nInside passport.authenticate() callback', {user: req.user, passport: req.session.passport, info: info});
        if(err){
            return next(err);
        }
        req.login(user, (err) => {
            if(err){
                return next(err);
            }else{
                console.log('\nInside req.login() callback', {user: req.user, passport: req.session.passport, info: info});
                userData = {}
                for (const key in user) {
                    if(key != 'password') userData[key] = user[key];                        
                }
                return res.send({status: 'LOGIN SUCCESS', userData: userData});
            }
        })
    })(req, res, next);
});



module.exports = router;
