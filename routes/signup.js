var express = require('express');
var router = express.Router();
var passport      = require('passport')

var signupMid = passport.authenticate('signup', { session : false });

router.post('/', signupMid, (req, res, next)=> {
    //Only reached when the 'signup' middleware in auth.js has no errors
    res.json({ 
        message : 'Signup successful',
        user : req.user 
    });
});

module.exports = router;
