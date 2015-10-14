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
            room.deckAttacking = [];
            room.deck.run();
            room.finishedPlayers = [];

            ////////////////////////////Set all players first 6 cards////////////////////////////
            for(var i = 0; i < room.players.length; i++) {
                room.players[i].deck = [];
                for(var j = 0; j < 6; j++) {
                    room.players[i].deck.push(room.deck.deck.pop())
                }
            }

            var card;
            var iPlayer;

            ////////////////////////////find the less trump in players deck////////////////////////////
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
                room.idAttackPlayer = 0;
            } else {
                room.idAttackPlayer = iPlayer;
            }

            GLOBAL.DB.save();
            io.emit('turnToAttack', {playerId: room.players[room.idAttackPlayer]._id,
                playerName: room.players[room.idAttackPlayer].name, roomName: room.name})
        });

        ////////////////////////////when the player defends////////////////////////////
        socket.on('defendCard', function(data) {
            _.find(GLOBAL.DB.rooms, function(room) {
                if(room.name == data.roomName) {

                    if(room.deckAttacking.length % 2 == 0) return;
                    var idDefender = (room.idAttackPlayer + 1 > room.players.length - 1) ? 0 : room.idAttackPlayer + 1
                    var attackCard = room.deckAttacking[room.deckAttacking.length - 1]
                    var defendCard = room.players[idDefender].deck[data.idCard]

                    if(data.idCard == undefined || room.players[idDefender].deck[data.idCard] == undefined) return;

                    if(attackCard.isTrump) {
                        if(attackCard.isTrump != defendCard.isTrump || (defendCard.value != 0   // 0 - is Ace
                            && attackCard.value > defendCard.value) ) {
                            return;
                        }
                    } else {
                         if( !defendCard.isTrump && (attackCard.kind != defendCard.kind || (defendCard.value != 0   // 0 - is Ace
                             && attackCard.value > defendCard.value) ) ) {
                             return;
                         }
                    }

                    var card = room.players[idDefender].deck.splice(data.idCard, 1)[0];
                    room.deckAttacking.push(card);

                    GLOBAL.DB.save();

                    io.emit('defendCard', {playerId: room.players[idDefender]._id, deckAttackingLength: room.deckAttacking.length
                        , roomName: data.roomName, card: card});

                    io.emit('turnToAttack', {playerId: room.players[room.idAttackPlayer]._id,
                        playerName: room.players[room.idAttackPlayer].name, roomName: room.name})
                    return;
                }
            });
        });

        ////////////////////////////when the player attacks////////////////////////////
        socket.on('attackCard', function(data) {
            _.find(GLOBAL.DB.rooms, function(room) {
                if(room.name == data.roomName) {

                    if(data.idCard == undefined || room.players[room.idAttackPlayer].deck[data.idCard] == undefined) return;

                    if(room.deckAttacking.length % 2 == 1) return;//if there where an attack already

                    var idDefender = (room.idAttackPlayer + 1)  > room.players.length - 1 ? 0 : room.idAttackPlayer + 1

                    if(room.players[idDefender].deck.length == 0) return;//you can't attack if defender has not cards

                    ////////////check if there is card with such value in deckAttacking///////////////
                    if(room.deckAttacking.length > 0) {
                        var attackCard = _.find(room.deckAttacking, function(card) {
                            return card.value == room.players[room.idAttackPlayer].deck[data.idCard].value;
                        })
                        if(!attackCard) return;
                    }
                    /////////////////////////////////////////////////////////////////////////////
                    var card = room.players[room.idAttackPlayer].deck.splice(data.idCard, 1)[0];
                    room.deckAttacking.push(card);

                    GLOBAL.DB.save();
                    io.emit('attackCard', {playerId: room.idAttackPlayer, deckAttackingLength: room.deckAttacking.length
                        , roomName: data.roomName, card: card});

                    var idDefender = room.idAttackPlayer + 1 > room.players.length - 1 ? 0 : room.idAttackPlayer + 1;

                    io.emit('turnToDefend', {playerId: room.players[idDefender]._id,
                        playerName: room.players[idDefender].name, roomName: room.name})
                    return;
                }
            });
        });

        ////////////////////////////removing player ////////////////////////////
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
    });

        ////////////////////////////when attacker push 'pass' ////////////////////////////
        socket.on('passAttack', function(data) {
            _.find(GLOBAL.DB.rooms, function(room) {
                if(room.name == data.roomName) {

                    if(room.deckAttacking.length < 2) {//nobody defend yet
                        return;
                    }
                    io.emit('clearTable', {roomName: data.roomName})
                    room.deckAttacking = [];
                    room.idAttackPlayer = (room.idAttackPlayer + 1) > room.players.length - 1 ? 0 : room.idAttackPlayer + 1;

                    ////////////////////////////Fill decks of players ////////////////////////////
                    fillDecksOfPlayers(room)

                    if(!room.players[room.idAttackPlayer]) return;
                    ////////////////////////////////////////////////////////////////////////////
                    setTimeout(function() {
                        io.emit('getCards', room.name)
                        io.emit('turnToAttack', {playerId: room.players[room.idAttackPlayer]._id,
                            playerName: room.players[room.idAttackPlayer].name, roomName: room.name})}, 100)
                }
            })
        });

        ////////////////////////////when defender takes cards ////////////////////////////
        socket.on('takeCards', function(data) {
            _.find(GLOBAL.DB.rooms, function(room) {
                if(room.name == data.roomName) {
                    io.emit('clearTable', {roomName: data.roomName})
                    var idDefender = (room.idAttackPlayer + 1) > room.players.length - 1 ? 0 : room.idAttackPlayer + 1
                    room.idAttackPlayer = (idDefender + 1) > room.players.length - 1 ? 0 : idDefender + 1

                    room.players[idDefender].deck = room.players[idDefender].deck.concat(room.deckAttacking)
                    room.deckAttacking = [];
                    ////////////////////////////Fill decks of players ////////////////////////////
                    fillDecksOfPlayers(room)

                    if(!room.players[room.idAttackPlayer]) return;
                    /////////////////////////////////////////////////////////////////////////////
                    if(!room.players[room.idAttackPlayer]) return;

                    setTimeout(function() {io.emit('getCards', room.name)
                    io.emit('turnToAttack', {playerId: room.players[room.idAttackPlayer]._id,
                        playerName: room.players[room.idAttackPlayer].name, roomName: room.name})
                    }, 100)
                }
            })
        });

        function fillDecksOfPlayers(room) {

            for(var i = 0; i < room.players.length; i++) {
                while(room.players[i].deck.length < 6) {
                    if(room.deck.deck.length == 0) {

                        if(!room.players[i].deck[0] || room.players[i].deck.length == 0) {
                            room.players.splice(i, 1);
                        }
                        if(room.players.length == 1) {///somebody loose
                            io.emit('EndOfTheGame', {player: {name: room.players[0].name, _id: room.players[0]._id}
                                , roomName: room.name})
                        }

                        if(room.players.length == 0 ) {// people finished at the same time
                            io.emit('EndOfTheGame', {roomName: room.name})
                        }
                        break;
                    }
                    room.players[i].deck.push(room.deck.deck.pop());
                }
            }
        }

    });

    app.get('/deck', function (req, res) {
        res.send(GLOBAL.DB.deck)
    })

    app.post('/player', function (req, res) {

        if(!req.body.playerName || req.body.playerName.length > 30){
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
                    result.deckLength = item.deck.deck.length;
                    for(var j = 0; j < item.players.length; j++) {
                        if(item.players[j]._id == req.params.id) {
                            result.playerDeck = item.players[j].deck;

                            for(var k = j + 1; item.players[k] && k < item.players.length; k++) {
                                result.opponents.push({deckLength: item.players[k].deck.length, name: item.players[k].name})
                            }
                            for(var k = 0; k < j; k++) {
                                result.opponents.push({deckLength: item.players[k].deck.length, name: item.players[k].name})
                            }
                        }
                    }
                }
            }
        })
        res.send(result)
     });


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

