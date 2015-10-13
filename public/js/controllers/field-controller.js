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
                    this.socket.on('clearTable', this.clearTable.bind(this));

                    if(this.obj && data.nameRoom == this.obj.roomData.name) {
                        this.view.beginGame();
                    }
                }.bind(this))

                window.onbeforeunload = function (event) {
                    this.removePlayer();
                }.bind(this)

            },

            defendCard: function(data) {
            console.log('defendCard')
            if(data.roomName != this.obj.roomData.name) return;
            if(data.playerId == this.idPlayer) {
                this.view.setYourTurnFalse();
            }
            this.isDefender = false;
            this.view.clearDeck();
            this.view.renderDefend({deckAttackingLength: data.deckAttackingLength, card: data.card});
            this.getCards(data.roomName);
            },

            attackCard: function(data) {
                console.log('attackCard')
                if(data.roomName != this.obj.roomData.name) return;
                if(data.playerId == this.idPlayer) {
                    this.view.setYourTurnFalse();
                }
                this.view.clearDeck();
                this.view.renderAttack({deckAttackingLength: data.deckAttackingLength, card: data.card});
                this.getCards(data.roomName);
            },

            turnToAttack: function(data) {
                console.log('turnTo Attack')
                if(data.roomName != this.obj.roomData.name) return;
                if(data.playerId == this.idPlayer) {
                    this.view.setMessage("Your turn");
                    this.view.setYourTurnTrue();
                    this.isDefender = false;
                } else {
                    this.view.setMessage('player "' + data.playerName + '" move...')
                }
            },

            turnToDefend: function(data) {
                console.log('turnToDefend')
                if(data.roomName != this.obj.roomData.name) return;
                this.isDefender = true;
                if(data.playerId == this.idPlayer) {
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

            takeCards: function() {
                console.log('takeCards')
                if(!this.isDefender) return;
                this.socket.emit('takeCards', {roomName: this.obj.roomData.name})
            },

            passAttack:function() {
                console.log('passAttack')
                this.socket.emit('passAttack', {roomName: this.obj.roomData.name})
            },

            playerLeaved: function(data) {
                if(this.obj.roomData.name == data.roomName) {
                    this.view.setYourTurnTrue("");
                    this.view.remove();
                    this.view = new FieldView(this.obj)
                    this.initializeView.bind(this)(this.view)
                    this.view.beforeHideModal(this.obj.playerName)

                    this.socket.removeListener('turnToAttack')
                    this.socket.removeListener('turnToDefend')
                    this.socket.removeListener('attackCard')
                    this.socket.removeListener('defendCard')
                    this.socket.removeListener('getCards')
                    this.socket.removeListener('clearTable')
                }
            },

            getCards: function(roomName) {
                if(!this.obj || roomName != this.obj.roomData.name) return;

                var self = this;
                $.ajax({
                    type: "GET",
                    url: window.config.apiUrl + 'players/' + self.idPlayer,

                    success: function(data) {
                        console.log(data)
                        self.gameData = data;
                        self.view.renderCards(data.playerDeck);

                    },

                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                    }

                }).then(function(data) {
                    self.view.renderOpponentsCards(data.opponents);
                })
            },

            renderTrump: function() {
              this.view.renderTrump(this.gameData.trump)
            },

            cancelEnter: function() {
                this.trigger('change:cancelEnter')
            },

            removePlayer: function() {
                console.log('remove')
                this.socket.removeListener('playerLeaved')
                this.socket.removeListener('getCards')
                this.socket.removeListener('beginGame')
                this.socket.removeListener('turnToAttack')
                this.socket.removeListener('attackCard')
                this.socket.removeListener('turnToDefend')
                this.socket.removeListener('defendCard')
                this.socket.removeListener('clearTable')
                this.socket.emit('removePlayer', {playerId: this.idPlayer, roomName: this.view.obj.roomData.name})
                this.socket.emit('emitRedrawRoom');
                this.obj = null;
            },

            chooseCard: function() {
                if(this.isDefender) {
                    this.socket.emit('defendCard',{roomName: this.view.obj.roomData.name, idCard: this.view.idAttackCard})
                } else {
                this.socket.emit('attackCard',{roomName: this.view.obj.roomData.name, idCard: this.view.idAttackCard})
                }
            },

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

            clearTable: function() {
                this.view.clearTable();
            }
        })
        return FieldController;
    });