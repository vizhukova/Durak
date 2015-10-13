var Deck = require('./classes/Deck.js');

module.exports = function (app, io) {

    io.on('connection', function (socket) {
        console.log('New client connected!');

        socket.on('disconnect', function(){
            console.log('user disconnected');
        });

        socket.on('beginGame', function(data){
            io.emit('beginGame', data)

            var room = _.find(GLOBAL.DB.rooms, function(item) {
                if( item.name == data.nameRoom) return item;
            })

            room.deck = new Deck();
            room.deck.run();

            /////////Get all players first 6 cards//////////////////////
            for(var i = 0; i < room.players.length; i++) {
                room.players[i].deck = [];
                for(var j = 0; j < 6; j++) {
                    room.players[i].deck.push(room.deck.deck.pop())
                }
            }

            room.quequeToMove = [];
            var card;
            var iPlayer;

            for(var i = 0; i < room.players.length; i++) {
                for(var j = 0; j < 6; j++) {
                    if(room.players[i].deck[j].isTrump) {
                        if(!card || card.value > room.players[i].deck[j].value) {
                            card = room.players[i].deck[j];
                            iPlayer = i;
                        }
                    }
                }
            }

            if(!card) {
                for(var i = 0; i < room.players.length; i++) {
                    room.quequeToMove.push(i);
                }
            } else {
                for(var i = iPlayer; i < room.players.length; i++) {
                    room.quequeToMove.push(i);
                }
                for(var i = 0; i < iPlayer; i++) {
                    room.quequeToMove.push(i);
                }
            }

            console.log(room.deck.trump)
            console.log(room.quequeToMove)
            GLOBAL.DB.save();
            io.emit('getCards', room.name)
        });

        socket.on('removePlayer', function(data) {

            _.find(GLOBAL.DB.rooms, function(room) {
                if( room.name == data.roomName) {
                    for(var i = 0; i < room.players.length; i++) {
                        if(room.players[i]._id == data.playerId) {
                            room.deck = [];
                            room.players=[];
                            GLOBAL.DB.save();
                            io.emit('playerLeaved', {roomName: data.roomName});
                            return;
                        }
                    }
                }
            });
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

        if(req.body.playerName == '' || req.body.playerName.length > 30){
            res.status(400).send({'message': "Player name length should be more than 0 and less than 30!"})
            return;
        }

        var room = _.find(GLOBAL.DB.rooms, function(item) {
            if( item.name == req.body.roomName) return item;
        })

        if(room.count == room.players.length) {
            res.status(400).send({'message': "This room is full already!"})
            return;
        }

        var id = new Date() - 0;
        room.players.push({_id: id, name: req.body.playerName})

        GLOBAL.DB.save();

        res.status(200).send({id: id, idRoom: room._id})
    });

    app.get('/players/:id', function (req, res) {

        var result = {}
        result.opponents = [];

        _.find(GLOBAL.DB.rooms, function(item) {
            for(var i = 0; i < item.players.length; i++) {
                if(item.players[i]._id == req.params.id) {
                    result.trump = item.deck.trump;
                    for(var j = 0; j < item.players.length; j++) {
                        if(item.players[j]._id == req.params.id) {
                            result.playerDeck = item.players[j].deck;
                        } else {
                            result.opponents.push({deckLength: item.players[j].deck.length, name: item.players[j].name})
                        }
                    }
                }
            }
        })
        res.send(result)
     })

    app.get('/rooms', function (req, res) {
        res.send(GLOBAL.DB.rooms)
    })

    app.get('/rooms/:id', function (req, res) {
       var room = _.find(GLOBAL.DB.rooms, function(item) {
           if(item._id == req.params.id) return item;
       })
        res.send(room)
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