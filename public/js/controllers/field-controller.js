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

                this.socket.on('beginGame', function(data) {
                    if(data.nameRoom == this.obj.roomData.name) {
                        this.view.beginGame();
                    }
                }.bind(this))

                this.socket.on('getCards', this.getCards.bind(this))
                //this.socket.on('playerLeaved', function(data){this.playerLeaved(data)}.bind(this))

                this.view = new FieldView(obj)
                this.initializeView(this.view)

                window.onbeforeunload = function (event) {
                    alert(event.target.URL);return false;
                    this.removePlayer();
                }.bind(this)

            },

            initializeView: function(view) {
                view.on('change:newPlayer', this.newPlayer.bind(this))
                view.on('change:cancelEnter', this.cancelEnter.bind(this))
                view.on('change:removePlayer', this.removePlayer.bind(this))
            },

            playerLeaved: function(data) {
                if(this.obj.roomData.name == data.roomName) {
                    this.view = new FieldView(this.obj)
                    this.initializeView(this.view).bind(this)
                }
            },

            getCards: function() {
                var self = this;
                $.ajax({
                    type: "GET",
                    url: window.config.apiUrl + 'players/' + self.idPlayer,

                    success: function(data) {
                        console.log(data)
                        self.view.renderCards(data);
                    },

                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                    }

                }).then(function() {
                    $.ajax({
                        type: "GET",
                        url: window.config.apiUrl + 'opponents/' + self.idPlayer,

                        success: function(data) {
                            console.log(data)
                            self.view.renderOpponentsCards(data);
                        },

                        error: function(XMLHttpRequest, textStatus, errorThrown) {
                            alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                        }

                    })
                })
            },

            cancelEnter: function() {
                this.trigger('change:cancelEnter')
            },

            removePlayer: function() {
                console.log('remove')
                this.socket.emit('removePlayer', {playerId: this.idPlayer, roomName: this.view.obj.roomData.name})
                this.socket.emit('emitRedrawRoom');
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
            }
        })
        return FieldController;
    });