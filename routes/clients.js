var express = require('express');
var router = express.Router();

var Datastore = require('nedb');
var db = new Datastore({filename: 'db/clients.db', autoload: true});
//db.insert(clientsData);

router.get('/', function(req, res, next) {
    console.log('QUERY: ', req.query)
    db.find(getClientFilter(req.query), function(err, items) {
        res.json(items);
    });
    //res.send('respond with a resource');
});

var getClientFilter = function(query) {
    var result = {
        Name: new RegExp(query.Name, "i"),
        Address: new RegExp(query.Address, "i")
    };
    if(query.Married) {
        result.Married = query.Married === 'true' ? true : false;
    }
    if(query.Country && query.Country !== '0') {
        result.Country = parseInt(query.Country, 10);
    }
    return result;
};

router.post('/', function(req, res, next) {
    db.insert(prepareItem(req.body), function(err, item) {
        res.json(item);
    });
});

var prepareItem = function(source) {
    var result = source;
    result.Married = source.Married === 'true' ? true : false;
    result.Country = parseInt(source.Country, 10);
    return result;
};

module.exports = router;
