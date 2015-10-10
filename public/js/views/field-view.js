define([
        'views/base',
        'text!../templates/field-template.hbs',
        'handlebars'
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

                $('.field').on('click', this.onClick.bind(this));
            },

            render: function (obj) {
                var templ = Handlebars.compile(template)({name: obj.roomData.name});
                $(obj.parent).html(templ);
                $('#playerModal').modal();
            },

            onClick: function(event) {
                if( $(event.target).hasClass('exit') ) {
                    this.hideTable();
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
                        if( $('.container').hasClass('hide') )  $('.container').removeClass('hide')
                        if( $('.control-panel').hasClass('hide') )  $('.control-panel').removeClass('hide')

                        this.obj.playerName = name;

                        this.trigger("change:newPlayer");

                        return;
                    }
                }

                else if( $(event.target).hasClass('cancel') ) {
                    this.trigger("change:cancelEnter");
                }
            },

            hideTable: function() {
                $('#content').removeClass('not-redraw-rooms');
                setTimeout(function() {
                    $('body').removeClass('table')
                }, 500)
            },

            beginGame: function() {
                $('.loading').addClass('hide');
                if( $('#table').hasClass('hide') )  $('#table').removeClass('hide')
                this.setCardsOnCanvas();
            },

            setCardsOnCanvas: function() {
                this.tableCanvas = $('#table');
                this.context = this.tableCanvas.get(0).getContext('2d');
                this.imageObj = new Image();
                this.imageObj.src = "./images/cards.png";

                this.tableCanvas.on('click', function(evt) {
                    var rect = this.getMousePos(this.tableCanvas, evt)
                    this.isMouseOnCard(rect)
                }.bind(this));
            },


            getMousePos: function(canvas, evt) {
                var rect = this.tableCanvas.get(0).getBoundingClientRect();
                return {
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top
                };
            },


            isMouseOnCard: function(rect) {
                console.log(rect)
                if(rect.x > (800 / this.cards.length) && rect.x < (800 / this.cards.length + this.cards.length * 78.77)
                && rect.y > (560 - 114.4) && rect.y < 560) {
                 console.log('YOU ARE IN')
                }
            },

            renderCards: function(cards) {///cards {value, kind, isTrump}///
                ///////////////////////////////////////////////////////////////////
                // value:
                //  A = 0   10 = 5
                //  6 = 1   J = 6
                //  7 = 2   Q = 7
                //  8 = 3   K = 8
                //  9 = 4
                //
                //kind:
                //diamond = 1      club = 0
                //heart = 2        spade = 3
                ///////////////////////////////////////////////////////////////////
                this.cards = cards;
                var x = 78.77, y = 114.4;
                var dx = 800 / cards.length;
                for(var i = 0; i < cards.length; i++) {
                    this.context.drawImage(this.imageObj, x * cards[i].value, y * cards[i].kind
                        , x, y, dx, 560 - y, x, y);
                    dx += x;
                }
            },

            renderOpponentsCards: function(data) {
                var x = 78.77, y = 114.4;
                var dx;

                for(var i = 0; i < data.length; i++) {
                    (function(i){
                    if(i == 0) {
                        dx =  2 * (800 / data[i])
                        this.context.rotate(90 * Math.PI / 180)

                        for(var j = 0; j < data[i]; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, -100, x, y);
                            dx += 10;
                        }
                    }
                    else if(i == 1) {
                        dx = -50;
                        this.context.rotate(30 * Math.PI / 180)

                        for(var j = 0; j < data[i]; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, -200, x, y);
                            dx += 10;
                        }
                    }

                    else if(i == 2) {
                        console.log(1)
                        dx = (-800)/2 + 10 * data[i] / 2;
                        this.context.rotate(60 * Math.PI / 180)

                        for(var j = 0; j < data[i]; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, -100, x, y);
                            dx -= 10;
                        }
                    }

                    else if(i == 3) {
                        dx = -490 - 10 * data[i] / 2;
                        this.context.rotate(60 * Math.PI / 180)

                        for(var j = 0; j < data[i]; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, 500, x, y);
                            dx += 10;
                        }
                    }

                    else if(i == 4) {
                        dx = -360 - 10 * data[i] / 2;
                        this.context.rotate(30 * Math.PI / 180)

                        for(var j = 0; j < data[i]; j++) {
                            console.log('2')
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, 700, x, y);
                            dx += 10;
                        }
                    }
                    }.bind(this))(i)
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