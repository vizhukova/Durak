var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
GLOBAL._ = require('underscore');
var app = express();

var server = app.listen(127)
console.log('Server listening on port 127');

var io = require('socket.io')(server);


GLOBAL.DB = {
    save: function() {
        fs.writeFileSync('./db.json', JSON.stringify(this))
    },
    restore: function() {
        GLOBAL.DB = _.extend(GLOBAL.DB, JSON.parse(fs.readFileSync('./db.json', 'utf-8')))
    }
};

GLOBAL.DB.restore();
GLOBAL.DB.rooms = GLOBAL.DB.rooms || [];

_.each(GLOBAL.DB.rooms, function(room) {
    room.players = [];
})

console.log(GLOBAL.DB)


app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
});

app.use(express.static('public'))
app.use(bodyParser.json())


require('./controllers/game')(app, io)

