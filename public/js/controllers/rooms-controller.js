define([
        'controllers/base',
        'views/rooms-view',
        'controllers/field-controller',
        'io'
    ],

    function (Controller, RoomView, FieldController, io) {
        'use strict'

        var RoomsController = Controller.extend({

            initialize: function(obj) {
                this.obj = obj;
                this.makeView();

                var self = this;
                var socket = io();
                socket.on('emitRedrawRoom', function (data) {
                    self.redrawRooms()
                })

            },

            makeView: function() {
                ////////////////////////////get all rooms////////////////////////////
                $.ajax({
                    type: "GET",
                    url: window.config.apiUrl + 'rooms',

                    success: function(data) {
                    },

                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                    }

                }).then(function(data) {
                    this.obj.templates = {rooms: data};
                    this.obj.templates.isRoom = data.length > 0;
                    this.view = new RoomView(this.obj);
                    this.view.on('change:makeRoom', this.makeNewRoom.bind(this));
                    this.view.on('change:redrawRooms', this.redrawRooms.bind(this));
                    this.view.on('change:enterRoom', this.enterRoom.bind(this));
                }.bind(this))
            },

            enterRoom: function() {

                var fieldController = new FieldController({parent: '#content', roomData: {name: this.view.enterRoom}});
                fieldController.on('change:newPlayer', this.redrawRooms.bind(this));
                fieldController.on('change:cancelEnter', this.redrawRooms.bind(this));
            },

            makeNewRoom: function() {

                var self = this;
                $.ajax({
                    type: "POST",
                    url: window.config.apiUrl + 'rooms',
                    data: JSON.stringify(this.view.data),
                    contentType: 'application/json',

                    success: function(data) {
                        var fieldController = new FieldController({parent: '#content', roomData: self.view.data});
                        fieldController.on('change:newPlayer', self.redrawRooms.bind(self));
                        fieldController.on('change:cancelEnter', self.redrawRooms.bind(self));
                    },

                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert("ERROR: " + JSON.parse(XMLHttpRequest.responseText).message)
                    }

                })
            },

            redrawRooms: function() {
                setTimeout(function() {
                    this.makeView();
                }.bind(this), 200)

            }

        })
        return RoomsController;
    });