//Dependencies
var createError   = require('http-errors');
var express       = require('express');
var path          = require('path');
var cookieParser  = require('cookie-parser');
var logger        = require('morgan');
var indexRouter   = require('./routes/index');
var CORS          = require('cors')();
var passport      = require('passport')

//routes
var users = require('./routes/users');
var posts = require('./routes/posts');
var login = require('./routes/login');
var auth  = require('./routes/auth');

//App
var app = express();

//CORS
app.use(CORS);
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  next();
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


require('./routes/passportToken');
//require('./routes/passportSession');
function authorized(request, response, next) {
  passport.authenticate('jwt', { session: false, }, async (error, token) => {
    if (error || !token) {
      response.status(401).json({ message: 'Unauthorized' });
    }
  })(request, response, next);
} 
// API
app.use('/', indexRouter);
app.use('/login', login);
app.use('/auth', auth);
app.use('/users', authorized, users);
app.use('/posts', authorized, posts);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');

  let error = {
    type: err.errorType,
    key:  err.key,
    msg:  err.message
  };
  //res.status(412);
  res.json(error);

});

module.exports = app;
