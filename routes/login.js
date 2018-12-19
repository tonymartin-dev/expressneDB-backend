var express = require("express");
var router = express.Router();
var passport = require("passport");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res, next) => {
  passport.authenticate("login", async (err, user, info) => {
    try {
        if (err || !user) {
            const error = new Error("An Error occured");
            return next(error);
        }
        req.login(user, { session: false }, async error => {
            if (error) return next(error);
            //We don't want to store the sensitive information such as the user password in the token so we pick only the username and id
            const body = { _id: user._id, username: user.username };
            //Sign the JWT token and populate the payload with the user username and id
            const token = jwt.sign({ user: body }, "top_secret");       //The secret is used to decode the token in auth.js
            //Send back the token to the user
            return res.json({
                message : 'Login successful',
                token: token
            });
        });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

module.exports = router;
