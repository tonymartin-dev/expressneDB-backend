var express         = require('express');
var router          = express.Router();
var passport        = require('passport');
const jwt           = require("jsonwebtoken");
const localStrategy = require('passport-local').Strategy;

//Database
var Datastore   = require('nedb');
var db          = new Datastore({filename: 'db/clients.db', autoload: true});

// Using a unique constraint with the index
db.ensureIndex({ fieldName: 'name', unique: true }, function (err) {});
db.ensureIndex({ fieldName: 'username', unique: true }, function (err) {});
db.ensureIndex({ fieldName: 'email', unique: true }, function (err) {});

/**
 * METHODS
 */
router.get('/', function(req, res, next) {
    passport.authenticate('jwt', { session : false }, function (err, user, info){
        
        //Prevent continuing if there are errors
        if(err) {
            return next(err);
        }
        if(info){
            info.status = 401;
            return next(info);
        }

        //If the token is valid, give a response
        console.log('QUERY: ', req.query)
        db.find(getUserFilter(req.query), function(err, items) {
            if(err){
                next(err);
            } else{
                res.json(items);
            }
        });


    })(req, res, next);
});

router.post("/login", async (req, res, next) => {
    passport.authenticate("login", async (err, user, info) => {
      try {
        
        //Prevent continuing if there are errors
        if(err) {
            return next(err);
        }
        if(info){
            info.status = 401;
            return next(info);
        }
        
        req.login(user, { session: false }, async error => {
            if (error) return next(error);
            //We don't want to store the sensitive information such as the user password in the token so we pick only the username and id
            const body = { _id: user._id, username: user.username };
            //Sign the JWT token and populate the payload with the user username and id
            const token = jwt.sign({ user: body }, "top_secret", { expiresIn: '10m' });       //The secret is used to decode the token in auth.js
            //Send back the token to the user
            var sendUser = {...user};
            delete sendUser.password;
            return res.json({
                message : 'Login successful',
                user: sendUser,
                token: token
            });
        });

      } catch (error) {
        return next(error);
      }
    })(req, res, next);
});

router.post('/signup', function(req, res, next) {

    var requirementsError;
    checkRequired(req.body, function(err){
        requirementsError = err;
    });    
    if(requirementsError) return next(requirementsError);

    db.insert(prepareItem(req.body), function(err, item) {
        if(err) next(err);
        else res.json(item);
    });

});

router.post("/refreshToken", async (req, res, next) => {
    passport.authenticate('jwt', { session : false }, function (err, user, info){
       
        //Prevent continuing if there are errors
        if(err) {
            return next(err);
        }
        if(info){
            info.status = 401;
            return next(info);
        }

        const body = { _id: user._id, username: user.username };
        const token = jwt.sign({ user: body }, "top_secret", { expiresIn: '10m' });       //The secret is used to decode the token in auth.js

        res.json({
            msg: "token Refreshed",
            token: token
        })
    })(req, res, next);
});

/**
 * UTILS
 */
var checkRequired = function(body, cb){

    var err = undefined;

    if (body instanceof Array){
        body.forEach(function(element){
            
            if(!element.name || !element.username || !element.email || !element.password){
                err = {message: 'Name, username, password and email are required'}
            }

        })
    } else {
        if(!body.name || !body.username || !body.email || !body.password){
            err = {message: 'Name, username, password and email are required'}
        }
    }

    cb(err)

}

var prepareItem = function(source) {
    
    if (source instanceof Array){
        var result = [];
        source.forEach(function(user){
            result.push(getClientsInfo(user))
        })
    }else{
        var result = getClientsInfo(source);

    }

    function getClientsInfo(user){
        
        var output      = {};
        output.name     = user.name;
        output.username = user.username;
        output.email    = user.email;
        output.password = user.password;
        output.website  = user.website || null;
        output.phone    = user.phone || null;
        return output;
    }

    return result;

};

var getUserFilter = function(query) {
    var result = {
        name:       new RegExp(query.name, "i"),
        username:   new RegExp(query.username, "i"),
        _id:        new RegExp(query.id, "i"),
    };
    
    return result;
};

/**
 * Login Local Strategy
 * (Write here to use the clients db)
 */
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
              if( !user ) return done(null, false);
              
              //Send the user information to the next middleware
              return done(null, user);
  
          });
  
  
      })
    
}));

module.exports = router;
