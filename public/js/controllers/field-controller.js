define([
        'controllers/base',
        'views/field-view',
        'io'
    ],

    function (Controller, FieldView, io) {
        'use strict'

        var FieldController = Controller.extend({

            initialize: function(obj) {
                this.obj = obj;
                this.socket = io();

                this.view = new FieldView(obj)
                this.initializeView(this.view)

                this.socket.on('getCards', this.getCards.bind(this))
                this.socket.on('playerLeaved', function(data){this.playerLeaved(data)}.bind(this))
                this.socket.on('beginGame', function(data) {
                    this.socket.on('turnToAttack', function(data) {this.turnToAttack(data)}.bind(this));
                    this.socket.on('turnToDefend', function(data) {this.turnToDefend(data)}.bind(this));
                    this.socket.on('attackCard', function(data) {this.attackCard(data)}.bind(this));
                    this.socket.on('defendCard', function(data) {this.defendCard(data)}.bind(this));
                    this.socket.on('clearTable', function(data) {this.clearTable(data)}.bind(this));
                    this.socket.on('EndOfTheGame', function(data) {this.endOfTheGame(data)}.bind(this));

                    if(this.obj && data.nameRoom == this.obj.roomData.name) {
                        this.view.beginGame();
                        this.getCards(data.nameRoom)
                    }
                }.bind(this))

                window.onbeforeunload = function (event) {
                    this.removePlayer();
                }.bind(this)

            },

            ////////////////////////////shows defend card ////////////////////////////
            defendCard: function(data) {
                if(data.roomName != this.obj.roomData.name) return;
                if(data.playerId == this.idPlayer) {
                this.view.setYourTurnFalse();
            }
                this.isDefender = false;
                this.view.clearDeck();
                this.view.renderDefend({deckAttackingLength: data.deckAttackingLength, card: data.card});
                this.getCards(data.roomName)
            },

            ////////////////////////////shows attack card ////////////////////////////
            attackCard: function(data) {
                if(data.roomName != this.obj.roomData.name) return;
                if(data.playerId == this.idPlayer) {
                    this.view.setYourTurnFalse();
                }
                this.view.clearDeck();
                this.view.renderAttack({deckAttackingLength: data.deckAttackingLength, card: data.card});
                this.getCards(data.roomName)
            },

            ////////////////////////////shows who is attacker and let make an attack////////////////////////////
            turnToAttack: function(data) {
                if(data.roomName != this.obj.roomData.name) return;

                if(data.playerId == this.idPlayer) {
                    this.view.setMessage("Your turn");
                    this.view.setYourTurnTrue();
                    this.isDefender = false;
                } else {
                    this.view.setMessage('player "' + data.playerName + '" move...')
                    this.view.setYourTurnFalse();
                }
            },

            ////////////////////////////shows who is defender and let make defense////////////////////////////
            turnToDefend: function(data) {
                if(data.roomName != this.obj.roomData.name) return;
                if(data.playerId == this.idPlayer) {
                    this.isDefender = true;
                    this.view.setMessage("Your turn to defend");
                    this.view.setYourTurnTrue();
                } else {
                    this.view.setMessage('player "' + data.playerName + '" defends...')
                }
            },

            initializeView: function(view) {
                view.on('change:newPlayer', this.newPlayer.bind(this));
                view.on('change:cancelEnter', this.cancelEnter.bind(this));
                view.on('change:removePlayer', this.removePlayer.bind(this));
                view.on('change:showTrump', this.renderTrump.bind(this));
                view.on('change:chooseCard', this.chooseCard.bind(this));
                view.on('change:passAttack', this.passAttack.bind(this));
                view.on('change:takeCards', this.takeCards.bind(this));
            },

            ////////////////////////////when defender push 'take' cards////////////////////////////
            takeCards: function() {
                if(!this.isDefender) return;
                this.socket.emit('takeCards', {roomName: this.obj.roomData.name})
            },

            ////////////////////////////when attacker push 'pass' attack ////////////////////////////
            passAttack:function() {
                this.socket.emit('passAttack', {roomName: this.obj.roomData.name})
                this.getCards()
            },

            ////////////////////////////when some player leaves room ////////////////////////////
            playerLeaved: function(data) {
                if(this.obj.roomData.name == data.roomName) {
                    this.view.setYourTurnTrue("");
                    this.view.remove();
                    this.view = new FieldView(this.obj)
                    this.initializeView.bind(this)(this.view)
                    this.view.beforeHideModal(this.obj.playerName)
                    this.removeSocketListeners();
                }
            },

            ////////////////////////////get cards by id player ////////////////////////////
            getCards: function(roomName) {
                if(!this.obj || roomName != this.obj.roomData.name) return;

                var self = this;
                $.ajax({
                    type: "GET",
                    url: window.config.apiUrl + 'players/' + self.idPlayer,

                    success: function(data) {
                        self.gameData = data;
                        self.view.renderCards(data.playerDeck);

                    },

                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                    }

                }).then(function(data) {
                    self.view.renderOpponentsCards(data.opponents);
                    self.view.renderDeck({deckLength: data.deckLength, trump: data.trump})
                })
            },

            renderTrump: function() {
              this.view.renderTrump(this.gameData.trump)
            },

            /////////////////////////when player push on modal window 'cancel' registration /////////////////////////
            cancelEnter: function() {
                this.trigger('change:cancelEnter')
            },

            removePlayer: function() {
                this.removeSocketListeners();
                this.socket.removeListener('playerLeaved')
                this.socket.removeListener('beginGame')
                this.socket.emit('removePlayer', {playerId: this.idPlayer, roomName: this.view.obj.roomData.name})
                this.socket.emit('emitRedrawRoom');
                this.obj = null;
            },

            ////////////////////////when attacker or defender chose card for attack or defense ////////////////////////
            chooseCard: function() {
                if(this.isDefender) {
                    var self = this;
                    var data = {roomName: this.view.obj.roomData.name, idCard: this.view.idAttackCard};
                    this.socket.emit('defendCard',{roomName: this.view.obj.roomData.name, idCard: this.view.idAttackCard})
                } else {
                this.socket.emit('attackCard',{roomName: this.view.obj.roomData.name, idCard: this.view.idAttackCard})
                }
            },

            removeSocketListeners: function() {
                this.socket.removeListener('turnToAttack')
                this.socket.removeListener('turnToDefend')
                this.socket.removeListener('attackCard')
                this.socket.removeListener('defendCard')
                this.socket.removeListener('getCards')
                this.socket.removeListener('clearTable')
                this.socket.removeListener('EndOfTheGame')
            },

            ////////////////////////////when server send 'EndOfTheGame'////////////////////////////
            endOfTheGame: function(data) { //idPlayer roomName
                if(this.obj.roomData.name == data.roomName) {
                    if (data.player._id == this.idPlayer) {
                        this.view.setMessage("You lose")
                    } else {
                        this.view.setMessage('player "' + data.player.name + '" lose')
                    }

                    this.view.setYourTurnFalse();
                    this.removeSocketListeners();
                    this.socket.removeListener('EndOfTheGame')
                    this.socket.removeListener('playerLeaved')
                }
            },

            ////////////////////////////register new player in the room////////////////////////////
            newPlayer: function() {
                var self = this;
                $.ajax({
                    type: "POST",
                    url: window.config.apiUrl + 'player',
                    data: JSON.stringify({playerName: this.view.obj.playerName, roomName: this.view.obj.roomData.name}),
                    contentType: 'application/json',

                    success: function(data) {
                        self.idPlayer = data.id;
                        self.view.idPlayer = data.id;
                        self.socket.emit('emitRedrawRoom');
                    },

                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        self.view.hideTable();
                        alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                    }

                }).then(function(data){
                    $.ajax({
                            type: "GET",
                            url: window.config.apiUrl + 'rooms/' + data.idRoom,
                            success: function(data) {
                                if(data.count == data.players.length) {
                                    self.socket.emit('beginGame', {nameRoom: data.name})
                                }
                            },

                            error: function(XMLHttpRequest, textStatus, errorThrown) {
                                alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                            }

                    })
                })
                this.trigger('change:newPlayer')
            },

            ////////////////////////////clear context in canvas////////////////////////////
            clearTable: function(data) {
                if(this.obj.roomData.name == data.roomName) {
                    this.view.clearTable();
                }
            }
        })
        return FieldController;
    });