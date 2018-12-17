var express = require('express');
var router = express.Router();

var Datastore = require('nedb');
var db = new Datastore({filename: 'db/posts.db', autoload: true});
//db.insert(clientsData);
// Using a unique constraint with the index
db.ensureIndex({ fieldName: 'title', unique: true }, function (err) {});
db.ensureIndex({ fieldName: 'body', unique: true }, function (err) {});

router.get('/', function(req, res, next) {
    console.log('QUERY: ', req.query)
    db.find(getPostFilter(req.query), function(err, items) {
        if(err){
            next(err);
        } else{
            res.json(items);
        }
    });
    //res.send('respond with a resource');
});

var getPostFilter = function(query) {
    var result = {
        _id:       new RegExp(query.id, "i"),
        userId:   new RegExp(query.userId, "i"),
    };
    
    return result;
};

router.post('/', function(req, res, next) {

    var error;

    checkRequired(req.body, function(err){
        error = err;
    });

    if(error){
        next(error)
        return;
    }


    db.insert(prepareItem(req.body), function(err, item) {
        if(err){
            next(err)
        } else{
            res.json(item);
        }
    });
});

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
            result.push(getClientsInfo(post))
        })
    }else{
        var result = getClientsInfo(source);

    }

    function getClientsInfo(post){        
        var output      = {};
        output.title    = post.title;
        output.body     = post.body;
        output.userId   = post.userId;
        output.date     = new Date().getTime();

        return output;
    }

    return result;

};

router.put('/', function(req,res,next){
    console.log('Modify Post')
    console.log('QUERY: ', req.query)
    console.log('BODY: ', prepareItem(req.body))
    console.log('BODY: ', req.body)
    
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
});

var putPostFilter = function(query) {
    var result = {
        _id:       new RegExp(query.id, "i")
    };
    
    return result;
};

router.put('/', function(req,res,next){
    console.log('Modify Post')
    console.log('QUERY: ', req.query)
    console.log('BODY: ', prepareItem(req.body))
    console.log('BODY: ', req.body)
    
    db.update(putPostFilter(req.query), function(err, item) {
        if(err){
            next(err)
        }else{
            var element     = req.body;
            element.action  = "DELETED";
            element._id     = req.query.id;
            element.item    = item;
            res.json(element);
        }
    });
});

module.exports = router;
