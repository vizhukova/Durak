define([
    'views/base',
    'text!../templates/rooms-template.hbs',
    'handlebars'
    ],

    function (View, template, Handlebars) {
        'use strict'

        var RoomsView = View.extend({
            autoRender: true,
            template: template,
            data: {},

            initialize: function(obj) {
                this.obj = obj;
                this.render(obj)
                $('.rooms-content').on('click', this.onClick.bind(this) )
            },

            render: function(obj) {
                if($(obj.parent).hasClass('not-redraw-rooms')) return;

                var templ = Handlebars.compile(template)(obj.templates)
                $(obj.parent).html(templ)
            },

            onClick: function(event) {

                if( $(event.target).hasClass('close-room-button') ) {
                    this.trigger('change:redrawRooms')
                    return;
                }

                ////////////////////////////enter room////////////////////////////
                else if( $(event.target).hasClass('room') || $(event.target).parent().hasClass('room') ) {
                    var element;

                    if($(event.target).parent().hasClass('room')) {
                        element =  $(event.target).parent();//label on button
                    } else {
                        element =  $(event.target);//button
                    }

                    this.enterRoom = element.find('.name').html();
                    this.trigger('change:enterRoom');

                    return;
                }

                ////////////////////////////create new room////////////////////////////
                else if( $(event.target).hasClass('create-room-button') ) {
                    var arrInput = $('.create-room-input')
                    for(var item = 0; item < arrInput.length; item++) {

                        if(!$(arrInput[item])[0].value) { //if input is empty
                           $(arrInput[item]).parent().parent().find('.prompt').addClass('wrong')
                            return
                        }

                        if( $(arrInput[item]).hasClass('count') ) {
                            var val = parseInt( ($(arrInput[item])[0].value ) )
                            if( val > 6 || val < 2 ) {
                                $(arrInput[item]).parent().parent().find('.prompt').addClass('wrong')
                                return
                            } else {
                                this.data.count = val;
                            }
                        }

                        else if( $(arrInput[item]).hasClass('name') ) {
                            if( $(arrInput[item])[0].value.length > 30 ) {
                                $(arrInput[item]).parent().parent().find('.prompt').addClass('wrong')
                                return
                            } else {
                                this.data.name = $(arrInput[item])[0].value;
                            }
                        }
                    }
                    this.trigger('change:makeRoom')   //processing in rooms-controller
                    return;
                }
            }

        })
        return RoomsView;
});