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
                this.view.on('change:newPlayer', this.newPlayer.bind(this))
                this.view.on('change:cancelEnter', this.cancelEnter.bind(this))
                this.view.on('change:removePlayer', this.removePlayer.bind(this))
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
                        self.socket.emit('emitRedrawRoom');
                    },

                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                    }

                })
                this.trigger('change:newPlayer')
            }
        })
        return FieldController;
    });