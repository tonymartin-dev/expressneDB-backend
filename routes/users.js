var express = require('express');
var router = express.Router();

var Datastore = require('nedb');
var db = new Datastore({filename: 'db/clients.db', autoload: true});

// Using a unique constraint with the index
db.ensureIndex({ fieldName: 'name', unique: true }, function (err) {});
db.ensureIndex({ fieldName: 'username', unique: true }, function (err) {});
db.ensureIndex({ fieldName: 'email', unique: true }, function (err) {});

router.get('/', function(req, res, next) {
    console.log('QUERY: ', req.query)
    db.find(getUserFilter(req.query), function(err, items) {
        if(err){
            next(err);
        } else{
            res.json(items);
        }
    });
    //res.send('respond with a resource');
});

var getUserFilter = function(query) {
    var result = {
        name:       new RegExp(query.name, "i"),
        username:   new RegExp(query.username, "i"),
        _id:        new RegExp(query.id, "i"),
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
            
            if(!element.name || !element.username || !element.email){
                err = {message: 'Name, username and email are required'}
            }

        })
    } else {
        if(!body.name || !body.username || !body.email){
            err = {message: 'Name, username and email are required'}
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
        output.website  = user.website || null;
        output.phone    = user.phone || null;
        return output;
    }

    return result;

};

module.exports = router;
