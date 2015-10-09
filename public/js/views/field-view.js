define([
        'views/base',
        'text!../templates/field-template.hbs',
        'handlebars',
        'io'
    ],

    function (View, template, Handlebars, io) {
        'use strict'

        var FieldView = View.extend({
            autoRender: true,
            template: template,
            data: {},

            initialize: function (obj) {
                this.obj = obj;
                this.render(obj);

                this.socket  = io();
                $('.field').on('click', this.onClick.bind(this));
            },

            render: function (obj) {
                var templ = Handlebars.compile(template)({name: obj.roomData.name});
                console.log(obj)
                $(obj.parent).html(templ);
                $('#playerModal').modal();
            },

            onClick: function(event) {
                if( $(event.target).hasClass('exit') ) {
                    $('#content').removeClass('not-redraw-rooms');
                    $('body').removeClass('table')
                    this.trigger("change:removePlayer");
                }

                else if( $(event.target).hasClass('enter-game-button') ) {
                    var name = $(event.target).parent().prev().find('.player-name-input')[0].value;

                    if(name == '' || name.length > 30) {
                        console.log($(event.target).parent().prev().find('.prompt'));
                        $(event.target).parent().prev().find('.prompt').addClass('wrong');
                        return;
                    } else {
                        this.hideModal();
                        $(this.obj.parent).addClass('not-redraw-rooms')
                        if( $('.content').hasClass('hide') )  $('.content').removeClass('hide')
                        if( $('.control-panel').hasClass('hide') )  $('.control-panel').removeClass('hide')

                        this.obj.playerName = name;
                        //this.socket.emit('addNewPlayer', {roomName: this.obj.roomData.name, playerName: name});

                        this.trigger("change:newPlayer");

                        return;
                    }
                }

                else if( $(event.target).hasClass('cancel') ) {
                    this.trigger("change:cancelEnter");
                }
            },

            hideModal: function() {
                $('#playerModal').modal('hide');
                $('.modal-backdrop').remove();
                setTimeout(function() {
                    $('body').addClass('table')
                }, 500)
            }

        })
        return FieldView;
    });