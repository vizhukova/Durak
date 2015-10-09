var Deck = require('./classes/Deck.js');

module.exports = function (app, io) {

    //GLOBAL.DB.deck = new Deck()
    //GLOBAL.DB.deck.run()
    io.on('connection', function (socket) {
        console.log('New client connected!');

        socket.on('disconnect', function(){
            console.log('user disconnected');
        });

        socket.on('removePlayer', function(data) {
            var room = _.find(GLOBAL.DB.rooms, function(item) {
                if( item.name == data.roomName) return item;
            })
            var id = _.find(room.players, function(item, i, arr)  {
                if(item._id == data.playerId) {console.log(true);return i;}
            })

            for(var i = 0; i < room.players.length; i++) {
                if(room.players[i]._id == data.playerId) {
                    console.log(true);
                    room.players.splice(i, 1);
                    return;
                }
            }
            console.log('deleted user^');
            return;
            room.players.push({_id: new Date() - 0, name: data.playerName})
            console.log(data)
            io.emit('emitRedrawRoom')
        });

        socket.on('emitRedrawRoom', function() {
            io.emit('emitRedrawRoom')
        })
    });

    app.get('/deck', function (req, res) {
        res.send(GLOBAL.DB.deck)
    })

    app.get('/next', function (req, res) {
        res.send(GLOBAL.DB.deck.next())
    })

    app.post('/player', function (req, res) {
        var room = _.find(GLOBAL.DB.rooms, function(item) {
            if( item.name == req.body.roomName) return item;
        })
        var id = new Date() - 0;
        room.players.push({_id: id, name: req.body.playerName})
        res.status(200).send({id: id})
    })

    app.get('/rooms', function (req, res) {
        res.send(GLOBAL.DB.rooms)
    })

    app.post('/rooms', function (req, res) {

        if(req.body.name.length < 1 || req.body.name.length > 30) {
            res.status(400)
            return;
        }
        if(req.body.count < 2 || req.body.count > 7) {
            res.status(400)
            return;
        }

        for(var i = 0; i < GLOBAL.DB.rooms.length; i++) {
            if(GLOBAL.DB.rooms[i].name == req.body.name)
            {
                res.status(400).send({'message': "There is room with this name. Choose another!"})
                return;
            }
        }

        var id = new Date() - 0;

        req.body._id = id;
        req.body.deck = new Deck();
        req.body.players = []

        GLOBAL.DB.rooms.push(req.body);
        GLOBAL.DB.save();

        res.status(200).send({id: id})
    })
}