var express     = require('express');
var router      = express.Router();
var passport    = require('passport')

//Database
var Datastore   = require('nedb');
var db          = new Datastore({filename: 'db/posts.db', autoload: true});

// Using a unique constraint with the index
db.ensureIndex({ fieldName: 'title', unique: true }, function (err) {});
db.ensureIndex({ fieldName: 'body', unique: true }, function (err) {});

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

        console.log('\nGetting posts: ', req.query)
        db.find(getPostFilter(req.query), function(err, items) {
            if(err){
                console.log('ERROR: ', err)
                next(err);
            }else{
                console.log('SUCCESS: ', items)
                res.json(items);
            }
            console.log('/n')
        });

    })(req, res, next);

    //res.send('respond with a resource');
});

router.post('/', function(req, res, next) {

    passport.authenticate('jwt', { session : false }, function (err, user, info){
        
        //Prevent continuing if there are errors
        if(err) {
            return next(err);
        }
        if(info){
            info.status = 401;
            return next(info);
        }

        checkRequired(req.body, function(err){
            requirementsError = err;
        });    
        if(requirementsError) return next(error);
    
        console.log('\nCreating post', req.body);
        db.insert(prepareItem(req.body), function(err, item) {
            if(err){
                console.log('ERROR: ', err)
                next(err)
            }else{
                console.log('SUCCESS: ', item)
                res.json(item);
            }
            console.log('/n')
        });
        
    })(req, res, next);

});

router.put('/', function(req,res,next){
    
    passport.authenticate('jwt', { session : false }, function(err, user, info){
        
        //Prevent continuing if there are errors
        if(err) {
            return next(err);
        }
        if(info){
            info.status = 401;
            return next(info);
        }

        if (req.body.userId != user._id ){
            var error = {
                status: 401,
                message: 'You can only modify your own posts'
            }
            return next(error);
        }

        db.update(putPostFilter(req.query), req.body, function(err, item) {
            if(err){
                next(err)
            }else{
                var element     = req.body;
                element.action  = "MODIFIED";
                element._id     = req.query.id;
                element.item    = item;
                res.json(element);
            }
        });

    })(req, res, next);
    
});

router.delete('/', function(req,res,next){
    
    passport.authenticate('jwt', { session : false }, function (err, user, info){
        
        //Prevent continuing if there are errors
        if(err) {
            return next(err);
        }
        if(info){
            info.status = 401;
            return next(info);
        }

        //Only delete user's own posts
        db.find(getPostFilter(req.query), function(err, items) {
            if(err){
                console.log('ERROR: ', err)
                return next(err)
            }else if (items[0].userId != user._id ){
                error = {
                    status: 401,
                    msg: 'You can only delete your own posts'
                }
                return next(error);
            }

            db.remove(putPostFilter(req.query), function(err, numRemoved) {
                if(err){
                    next(err)
                }else{
                    var response = {
                        action      : "DELETED",
                        numRemoved  : numRemoved,
                        element     : items[0]
                    };
                    res.json(response);
                }
            });

        })


        })(req, res, next);
    
});

/**
 * UTILS
 */
var getPostFilter = function(query) {
    var result = {
        _id:       new RegExp(query.id, "i"),
        userId:   new RegExp(query.userId, "i"),
    };
    
    return result;
};

var checkRequired = function(body, cb){

    var err = undefined;

    if (body instanceof Array){
        body.forEach(function(element){
            
            if(!element.title || !element.body || !element.userId){
                err = {message: 'Title, body and user are required'}
            }

        })
    } else {
        if(!body.title || !body.body || !body.userId){
            err = {message: 'Title, body and user are required'}
        }
    }

    cb(err)

}

var prepareItem = function(source) {
    
    if (source instanceof Array){
        var result = [];
        source.forEach(function(post){
            result.push(getPostsInfo(post))
        })
    }else{
        var result = getPostsInfo(source);

    }

    function getPostsInfo(post){        
        var output      = {};
        output.title    = post.title;
        output.body     = post.body;
        output.userId   = post.userId;
        output.date     = new Date().getTime();

        return output;
    }

    return result;

};

var putPostFilter = function(query) {
    var result = {
        _id:       new RegExp(query.id, "i")
    };
    
    return result;
};

module.exports = router;
